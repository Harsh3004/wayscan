'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@ai-sdk/react';
import {
  Mic,
  MicOff,
  Send,
  X,
  Bot,
  Loader2,
  Volume2,
  Settings,
  Sparkles,
  GripHorizontal,
} from 'lucide-react';
import { buildCompactDashboardChatContext, buildDashboardChatContext } from '@/lib/chat-context';
import { mockDashboardStats, potholes as allPotholes } from '@/lib/mock-data';
import { useDashboardChatContext } from '@/components/dashboard/chat-context-provider';
import { cn } from '@/lib/utils';

class VoiceAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;

  async init(): Promise<boolean> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
      return true;
    } catch (error) {
      console.error('Failed to init audio context:', error);
      return false;
    }
  }

  async startCapture(): Promise<MediaStream | null> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });

      if (this.audioContext && this.analyser) {
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        source.connect(this.analyser);
      }

      return this.mediaStream;
    } catch (error) {
      console.error('Failed to capture audio:', error);
      return null;
    }
  }

  stopCapture(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  getFrequencyData(): number[] {
    if (!this.analyser || !this.dataArray) return [];
    this.analyser.getByteFrequencyData(this.dataArray);
    return Array.from(this.dataArray);
  }

  getAudioLevel(): number {
    const data = this.getFrequencyData();
    if (data.length === 0) return 0;
    const sum = data.reduce((accumulator, value) => accumulator + value, 0);
    return sum / data.length / 255;
  }

  destroy(): void {
    this.stopCapture();
    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }
  }
}

function extractText(message: any): string {
  if (!message) return '';

  if (typeof message.content === 'string') {
    return message.content;
  }

  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text)
      .join('');
  }

  return '';
}

function VoiceVisualizer({ isListening, isSpeaking, audioLevel }: { isListening: boolean; isSpeaking: boolean; audioLevel: number }) {
  const bars = 20;
  const [heights, setHeights] = useState<number[]>(Array(bars).fill(8));

  useEffect(() => {
    if (!isListening && !isSpeaking) {
      setHeights(Array(bars).fill(8));
      return;
    }

    const interval = window.setInterval(() => {
      setHeights(previousHeights => {
        const targetLevel = isSpeaking ? Math.min(audioLevel * 120, 100) : 40;

        return previousHeights.map((height, index) => {
          const variation = Math.random() * 25 - 12;
          const wave = Math.sin((index / bars) * Math.PI * 2) * 15;
          const target = targetLevel + variation + wave;
          return Math.max(6, Math.min(56, height + (target - height) * 0.35));
        });
      });
    }, 40);

    return () => window.clearInterval(interval);
  }, [isListening, isSpeaking, audioLevel, bars]);

  return (
    <div className="flex items-center justify-center gap-0.75 h-14 px-2">
      {heights.map((height, index) => (
        <motion.div
          key={index}
          className={cn(
            'w-1 rounded-full',
            isListening
              ? 'bg-linear-to-t from-blue-400 via-cyan-300 to-emerald-300'
              : isSpeaking
                ? 'bg-linear-to-t from-emerald-400 via-teal-300 to-cyan-300'
                : 'bg-white/40',
          )}
          animate={{ height: isListening || isSpeaking ? height : 8 }}
          transition={{ duration: 0.04 }}
        />
      ))}
    </div>
  );
}

const suggestions = [
  { label: 'Total pothole count', action: 'How many potholes are currently active?' },
  { label: 'Latest detection', action: 'What is the latest pothole detection?' },
  { label: 'Critical issues', action: 'Which potholes need immediate attention?' },
  { label: 'Jabalpur summary', action: 'Give me a quick summary for Jabalpur.' },
];

export default function AgentPanel() {
  const { dashboardContext: sharedDashboardContext } = useDashboardChatContext();
  const fallbackDashboardContext = useMemo(
    () => buildDashboardChatContext(allPotholes, mockDashboardStats),
    [],
  );
  const activeDashboardContext = sharedDashboardContext ?? fallbackDashboardContext;

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [localInput, setLocalInput] = useState('');
  const [fabPosition, setFabPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceAnalyzerRef = useRef<VoiceAnalyzer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const transcriptRef = useRef('');
  const voiceEnabledRef = useRef(true);
  const isLoadingRef = useRef(false);
  const isChatBusyRef = useRef(false);
  const lastSpokenMessageIdRef = useRef<string | null>(null);

  const activeChatContext = useMemo(() => buildCompactDashboardChatContext(activeDashboardContext), [activeDashboardContext]);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  const speakAssistantResponse = useCallback((message: any) => {
    const text = extractText(message).trim();
    if (!text || !voiceEnabledRef.current || typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    const sanitizedText = text.replace(/\s+/g, ' ').trim();
    const sentenceChunks = sanitizedText.match(/[^.!?]+[.!?]?/g)?.map(chunk => chunk.trim()).filter(Boolean) ?? [sanitizedText];
    const chunks: string[] = [];

    for (const sentence of sentenceChunks) {
      if (sentence.length <= 120) {
        chunks.push(sentence);
        continue;
      }

      const words = sentence.split(/\s+/);
      let currentChunk = '';

      for (const word of words) {
        const nextChunk = currentChunk ? `${currentChunk} ${word}` : word;
        if (nextChunk.length > 100) {
          if (currentChunk) {
            chunks.push(currentChunk);
          }
          currentChunk = word;
        } else {
          currentChunk = nextChunk;
        }
      }

      if (currentChunk) {
        chunks.push(currentChunk);
      }
    }

    if (chunks.length === 0) {
      chunks.push(sanitizedText);
    }

    const speakChunk = (index: number) => {
      const chunk = chunks[index];
      if (!chunk) {
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.rate = 0.88;
      utterance.pitch = 1;
      utterance.volume = 0.98;
      utterance.lang = navigator.language || 'en-US';

      const voices = synth.getVoices();
      const preferredVoice =
        voices.find(voice => voice.lang?.toLowerCase().startsWith('en-in')) ??
        voices.find(voice => voice.lang?.toLowerCase().startsWith('en')) ??
        voices[0];

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => speakChunk(index + 1);
      utterance.onerror = () => setIsSpeaking(false);

      synth.speak(utterance);
    };

    const startSpeaking = () => {
      setIsSpeaking(true);
      speakChunk(0);
    };

    if (synth.getVoices().length > 0) {
      startSpeaking();
      return;
    }

    const handleVoicesChanged = () => {
      synth.removeEventListener('voiceschanged', handleVoicesChanged);
      startSpeaking();
    };

    synth.addEventListener('voiceschanged', handleVoicesChanged);
    window.setTimeout(() => {
      synth.removeEventListener('voiceschanged', handleVoicesChanged);
      if (synth.getVoices().length > 0) {
        startSpeaking();
      }
    }, 100);
  }, []);

  const chat = useChat({
    api: '/api/chat',
    body: { dashboardContext: activeChatContext },
    maxSteps: 1,
    onFinish: ({ message }: any) => {
      lastSpokenMessageIdRef.current = message?.id ?? null;
      speakAssistantResponse(message);
    },
  } as any) as any;

  const { messages = [], sendMessage, isLoading, error, status } = chat;
  const isChatBusy = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    isChatBusyRef.current = isChatBusy;
  }, [isChatBusy]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    voiceAnalyzerRef.current = new VoiceAnalyzer();
    void voiceAnalyzerRef.current.init();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        transcriptRef.current = '';
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);

        const finalTranscript = transcriptRef.current.trim();
        if (finalTranscript && !isLoadingRef.current && !isChatBusyRef.current) {
          void sendMessage({ text: finalTranscript });
          setLocalInput('');
        }

        transcriptRef.current = '';
      };

      recognitionRef.current.onresult = (event: any) => {
        const results = Array.from(event.results);
        const transcript = results.map((result: any) => result[0].transcript).join('');
        transcriptRef.current = transcript;
        setLocalInput(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          transcriptRef.current = '';
        }
      };
    }

    return () => {
      voiceAnalyzerRef.current?.destroy();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    const updateAudioLevel = async () => {
      if (isListening && voiceAnalyzerRef.current) {
        const stream = await voiceAnalyzerRef.current.startCapture();
        if (stream) {
          const updateLevel = () => {
            if (voiceAnalyzerRef.current && isListening) {
              setAudioLevel(voiceAnalyzerRef.current.getAudioLevel());
              animationFrameRef.current = requestAnimationFrame(updateLevel);
            }
          };

          updateLevel();
        }
      } else {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        setAudioLevel(0);
        voiceAnalyzerRef.current?.stopCapture();
      }
    };

    void updateAudioLevel();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isListening]);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const clampFloatingPosition = (nextX: number, nextY: number) => {
    if (typeof window === 'undefined') return { x: nextX, y: nextY };

    const margin = 24;
    const buttonSize = 64;
    const minX = -(window.innerWidth - buttonSize - margin * 2);
    const minY = -(window.innerHeight - buttonSize - margin * 2);

    return {
      x: Math.min(0, Math.max(minX, nextX)),
      y: Math.min(0, Math.max(minY, nextY)),
    };
  };

  const sendDashboardMessage = useCallback(
    (text: string) => {
      const trimmedText = text.trim();
      if (!trimmedText || isLoadingRef.current || isChatBusy) return;

      void sendMessage({ text: trimmedText });
      setLocalInput('');
    },
    [sendMessage, isChatBusy],
  );

  const toggleListen = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported. Please use Chrome or Edge.');
      return;
    }

    try {
      if (isSpeaking) {
        stopSpeaking();
      }

      if (isListening) {
        recognitionRef.current.stop();
      } else {
        transcriptRef.current = '';
        setLocalInput('');
        recognitionRef.current.start();
      }
    } catch (error) {
      console.warn('Speech recognition error:', error);
    }
  }, [isListening, isSpeaking, stopSpeaking]);

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    sendDashboardMessage(localInput);
  };

  const handleSuggestionClick = (action: string) => {
    sendDashboardMessage(action);
  };

  return (
    <>
      <motion.div
        drag
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(_, info) => {
          setIsDragging(false);
          setFabPosition(previousPosition => clampFloatingPosition(
            previousPosition.x + info.offset.x,
            previousPosition.y + info.offset.y,
          ));
        }}
        style={{ x: fabPosition.x, y: fabPosition.y }}
        className={cn(
          'fixed bottom-6 right-6 z-50 cursor-grab active:cursor-grabbing',
          isDragging && 'cursor-grabbing',
        )}
      >
        <motion.button
          onClick={() => !isDragging && setIsOpen(true)}
          className={cn(
            'w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all',
            'bg-linear-to-br from-blue-600 via-blue-500 to-cyan-500',
            'hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600',
            isOpen ? 'opacity-0 pointer-events-none scale-50' : 'opacity-100 scale-100 hover:scale-110',
            isDragging && 'scale-110 shadow-3xl',
          )}
          whileHover={{ scale: isDragging ? 1.1 : 1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Open WayScan assistant"
          title="Open WayScan assistant"
        >
          <div className="relative">
            <Bot className="w-7 h-7 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
          <div className="absolute -top-1 left-1/2 -translate-x-1/2">
            <GripHorizontal className="w-3 h-3 text-white/60" />
          </div>
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className={cn(
              'fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50',
              'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl',
              'w-105 max-w-[calc(100vw-1.5rem)] h-150 max-h-[calc(100vh-1.5rem)]',
            )}
          >
            <div className="relative px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-linear-to-r from-blue-600 to-cyan-500">
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">WayScan AI</h3>
                    <p className="text-blue-100 text-xs">Read-only dashboard assistant</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSettings(previous => !previous)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                    aria-label="Open settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      stopSpeaking();
                      setIsOpen(false);
                    }}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                    aria-label="Close assistant"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 bg-black/20 rounded-xl p-2">
                <VoiceVisualizer isListening={isListening} isSpeaking={isSpeaking} audioLevel={audioLevel} />
                <div className="flex items-center justify-between mt-1 px-2">
                  <span className="text-white/70 text-[10px] font-medium">
                    {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Voice ready'}
                  </span>
                  {(isListening || isSpeaking) && (
                    <button
                      onClick={isListening ? toggleListen : stopSpeaking}
                      className="text-white/70 hover:text-white text-[10px] font-medium flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Stop
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <div className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/95">
                  Active {activeDashboardContext.stats.totalActive}
                </div>
                <div className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/95">
                  Critical {activeDashboardContext.stats.criticalHazards}
                </div>
                <div className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/95">
                  Sync {activeDashboardContext.stats.pendingSync}
                </div>
              </div>
            </div>

            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-slate-100 dark:border-slate-800"
                >
                  <div className="p-4 space-y-3 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Voice Output</span>
                      </div>
                      <button
                        onClick={() => setVoiceEnabled(previous => !previous)}
                        className={cn(
                          'w-12 h-6 rounded-full transition-all relative p-1',
                          voiceEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600',
                        )}
                      >
                        <div
                          className={cn(
                            'w-4 h-4 bg-white rounded-full shadow transition-all duration-200',
                            voiceEnabled ? 'translate-x-6' : 'translate-x-0',
                          )}
                        />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">Every assistant reply is spoken aloud when voice is enabled.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-4"
                >
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-linear-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Ask for a snapshot</h4>
                  <p className="text-sm text-slate-500 mb-4">Ask about totals, recent detections, pothole details, or a city summary.</p>
                  <div className="space-y-2">
                    {suggestions.map(suggestion => (
                      <button
                        key={suggestion.label}
                        onClick={() => handleSuggestionClick(suggestion.action)}
                        className="w-full text-left px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {messages
                .filter((message: any) => message.role !== 'system' && message.role !== 'tool')
                .map((message: any) => {
                  const textContent = extractText(message);

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center mr-2 shrink-0 shadow-lg">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'px-4 py-3 rounded-2xl text-sm max-w-[82%] shadow-md whitespace-pre-wrap',
                          message.role === 'user'
                            ? 'bg-linear-to-r from-blue-600 to-blue-500 text-white rounded-br-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-100 dark:border-slate-700',
                        )}
                      >
                        {textContent || (message.role === 'assistant' ? 'Thinking...' : '')}
                      </div>
                    </motion.div>
                  );
                })}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center mr-2 shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-sm border border-slate-100 dark:border-slate-700 px-4 py-3 shadow-md">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                  {error.message || 'Something went wrong. Please try again.'}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-t border-slate-100 dark:border-slate-800">
              <form onSubmit={handleFormSubmit} className="flex items-center gap-3">
                <motion.button
                  type="button"
                  onClick={toggleListen}
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 shadow-lg',
                    isListening
                      ? 'bg-linear-to-br from-red-500 to-rose-500 animate-pulse'
                      : 'bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800',
                  )}
                  whileTap={{ scale: 0.95 }}
                >
                  {isListening ? (
                    <MicOff className="w-5 h-5 text-white" />
                  ) : (
                    <Mic className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  )}
                </motion.button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={localInput}
                    onChange={event => setLocalInput(event.target.value)}
                    placeholder={isListening ? 'Listening...' : 'Ask for totals, recent detections, or pothole details...'}
                    className="w-full h-12 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 pr-12 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  />
                  {localInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setLocalInput('');
                        transcriptRef.current = '';
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={!localInput.trim() || isLoading || isChatBusy}
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-all',
                    localInput.trim() && !isLoading && !isChatBusy
                      ? 'bg-linear-to-br from-blue-600 to-cyan-500'
                      : 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed',
                  )}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="w-5 h-5 text-white" />
                </motion.button>
              </form>

              <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-slate-400">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    isListening ? 'bg-red-500 animate-pulse' : isSpeaking ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400',
                  )}
                />
                <span>{isListening ? 'Listening - speak now' : isSpeaking ? 'Speaking...' : 'Click mic or type to ask for a dashboard snapshot'}</span>
                {voiceEnabled && !isSpeaking && <Volume2 className="w-3 h-3 ml-1" />}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
