'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  VolumeX,
  Waves,
  Settings,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { FilterState } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AgentPanelProps {
  onUpdateFilters?: (filters: Partial<FilterState>) => void;
  onSetMapCenter?: (lat: number, lng: number) => void;
  onSelectPothole?: (id: string) => void;
}

interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Web Audio API analyzer for voice visualization
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
    } catch (e) {
      console.error('Failed to init audio context:', e);
      return false;
    }
  }

  async startCapture(): Promise<MediaStream | null> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      if (this.audioContext && this.analyser) {
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        source.connect(this.analyser);
      }
      return this.mediaStream;
    } catch (e) {
      console.error('Failed to capture audio:', e);
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
    const sum = data.reduce((a, b) => a + b, 0);
    return sum / data.length / 255;
  }

  destroy(): void {
    this.stopCapture();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Voice Activity Visualizer Component
function VoiceVisualizer({
  isListening,
  isSpeaking,
  audioLevel
}: {
  isListening: boolean;
  isSpeaking: boolean;
  audioLevel: number;
}) {
  const bars = 12;
  const [heights, setHeights] = useState<number[]>(Array(bars).fill(10));

  useEffect(() => {
    if (!isListening && !isSpeaking) {
      setHeights(Array(bars).fill(10));
      return;
    }

    const interval = setInterval(() => {
      setHeights(prev => {
        const targetLevel = isSpeaking ? audioLevel * 100 : 30;
        return prev.map((h, i) => {
          const variation = Math.random() * 20 - 10;
          const target = targetLevel + variation + Math.sin(i * 0.5) * 15;
          return Math.max(8, Math.min(100, h + (target - h) * 0.3));
        });
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isListening, isSpeaking, audioLevel]);

  return (
    <div className="flex items-center justify-center gap-1 h-12 px-4">
      {heights.map((height, i) => (
        <motion.div
          key={i}
          className={cn(
            'w-1.5 rounded-full transition-all duration-75',
            isListening
              ? 'bg-gradient-to-t from-blue-500 to-cyan-400'
              : isSpeaking
              ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
              : 'bg-slate-300 dark:bg-slate-600'
          )}
          animate={{
            height: isListening || isSpeaking ? height : 10,
          }}
          transition={{ duration: 0.05 }}
        />
      ))}
    </div>
  );
}

// Suggestion chips component
const suggestions = [
  { label: 'Show high priority issues', action: 'Show me all high priority potholes on the map' },
  { label: 'Jabalpur statistics', action: 'What are the statistics for Jabalpur?' },
  { label: 'Unresolved issues', action: 'Show me issues unresolved for more than 7 days' },
  { label: 'Team assignments', action: 'Which teams are currently assigned to repairs?' },
];

export default function AgentPanel({ onUpdateFilters, onSetMapCenter, onSelectPothole }: AgentPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [localInput, setLocalInput] = useState('');
  const [voiceHistory, setVoiceHistory] = useState<VoiceMessage[]>([]);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceAnalyzerRef = useRef<VoiceAnalyzer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // @ts-ignore - AI SDK v6 useChat API
  const { messages = [], sendMessage, isLoading, error } = useChat({
    // @ts-ignore
    api: '/api/chat',
    maxSteps: 5,
    onToolCall: (params: any) => {
      const toolCall = params.toolCall;
      const args = toolCall.args as any;
      if (toolCall.toolName === 'updateFilters') {
        const newFilters: Partial<FilterState> = {};
        if (args.priority) newFilters.priority = args.priority;
        if (args.city) newFilters.city = args.city;
        if (args.state) newFilters.state = args.state;
        if (args.status) newFilters.status = args.status;
        if (args.areaType) newFilters.areaType = args.areaType;
        onUpdateFilters?.(newFilters);
      } else if (toolCall.toolName === 'setMapCenter') {
        onSetMapCenter?.(args.lat, args.lng);
      } else if (toolCall.toolName === 'selectPothole') {
        onSelectPothole?.(args.id);
      }
    },
    onFinish: (event: any) => {
      const message = event?.message || event;
      const speechText = message.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || message.content || '';

      setVoiceHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: speechText,
        timestamp: Date.now()
      }]);

      if (speechText && voiceEnabled && window.speechSynthesis) {
        setIsSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 0.9;

        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
      }
    }
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, voiceHistory]);

  // Initialize voice analyzer
  useEffect(() => {
    if (typeof window !== 'undefined') {
      voiceAnalyzerRef.current = new VoiceAnalyzer();
      voiceAnalyzerRef.current.init();

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onstart = () => setIsListening(true);
        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          setLocalInput(transcript);
        };
        recognitionRef.current.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
        };
      }
    }

    return () => {
      voiceAnalyzerRef.current?.destroy();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Audio level monitoring
  useEffect(() => {
    const updateAudioLevel = async () => {
      if (isListening && voiceAnalyzerRef.current) {
        const stream = await voiceAnalyzerRef.current.startCapture();
        if (stream) {
          const updateLevel = () => {
            if (voiceAnalyzerRef.current) {
              const level = voiceAnalyzerRef.current.getAudioLevel();
              setAudioLevel(level);
            }
            if (isListening) {
              animationFrameRef.current = requestAnimationFrame(updateLevel);
            }
          };
          updateLevel();
        }
      } else {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setAudioLevel(0);
        voiceAnalyzerRef.current?.stopCapture();
      }
    };

    updateAudioLevel();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isListening]);

  const toggleListen = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    try {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
      }
    } catch (e) {
      console.warn('Speech recognition error:', e);
    }
  }, [isListening]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localInput.trim()) return;
    sendMessage({ text: localInput });
    setVoiceHistory(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: localInput,
      timestamp: Date.now()
    }]);
    setLocalInput('');
  };

  const handleSuggestionClick = (action: string) => {
    setLocalInput(action);
    sendMessage({ text: action });
    setVoiceHistory(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: action,
      timestamp: Date.now()
    }]);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl z-50 flex items-center justify-center transition-all',
          'bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500',
          'hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600',
          'active:scale-95',
          isOpen ? 'opacity-0 pointer-events-none scale-50' : 'opacity-100 scale-100 hover:scale-110'
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative">
          <Bot className="w-7 h-7 text-white" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
        </div>
        {/* Ripple effect */}
        <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-6 right-6 w-[420px] h-[580px] z-50 flex flex-col overflow-hidden rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="relative px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-600 to-cyan-500">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">WayScan AI Assistant</h3>
                    <p className="text-blue-100 text-xs">Voice-enabled dashboard control</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Voice Visualizer in Header */}
              <div className="mt-3 bg-black/20 rounded-xl p-2">
                <VoiceVisualizer
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  audioLevel={audioLevel}
                />
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
            </div>

            {/* Settings Panel */}
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
                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                        className={cn(
                          'w-12 h-6 rounded-full transition-all relative p-1',
                          voiceEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                        )}
                      >
                        <div className={cn(
                          'w-4 h-4 bg-white rounded-full shadow transition-all duration-200',
                          voiceEnabled ? 'translate-x-6' : 'translate-x-0'
                        )} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">AI responses will be spoken aloud</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
              {/* Welcome Message */}
              {messages.length === 0 && voiceHistory.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-6"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Hello! I&apos;m your WayScan Assistant</h4>
                  <p className="text-sm text-slate-500 mb-4">I can help you control the dashboard with your voice or text.</p>

                  {/* Suggestions */}
                  <div className="space-y-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.label}
                        onClick={() => handleSuggestionClick(suggestion.action)}
                        className="w-full text-left px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Voice History */}
              {voiceHistory.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    'flex',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mr-2 shrink-0 shadow-lg">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'px-4 py-2.5 rounded-2xl text-sm max-w-[80%] shadow-md',
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-100 dark:border-slate-700'
                    )}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {/* AI SDK Messages */}
              {messages.filter((m: any) => m.role !== 'tool' && m.role !== 'system').map((m: any) => {
                const textContent = m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || m.content || '';
                const hasToolInvocations = m.parts?.some((p: any) => p.type && p.type.startsWith('tool-')) || m.toolInvocations;

                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    {m.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mr-2 shrink-0 shadow-lg">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'px-4 py-2.5 rounded-2xl text-sm max-w-[80%] shadow-md',
                        m.role === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-100 dark:border-slate-700'
                      )}
                    >
                      {textContent || (hasToolInvocations ? (
                        <span className="flex items-center gap-2 text-slate-500">
                          <Loader2 className="w-3 h-3 animate-spin" /> Executing...
                        </span>
                      ) : null)}
                    </div>
                  </motion.div>
                );
              })}

              {/* Loading State */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mr-2 shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-sm border border-slate-100 dark:border-slate-700 px-4 py-3 shadow-md">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                  {error.message || 'Something went wrong. Please try again.'}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-t border-slate-100 dark:border-slate-800">
              <form onSubmit={handleFormSubmit} className="flex items-center gap-3">
                {/* Mic Button */}
                <motion.button
                  type="button"
                  onClick={toggleListen}
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 shadow-lg',
                    isListening
                      ? 'bg-gradient-to-br from-red-500 to-rose-500 animate-pulse'
                      : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-700'
                  )}
                  whileTap={{ scale: 0.95 }}
                >
                  {isListening ? (
                    <MicOff className="w-5 h-5 text-white" />
                  ) : (
                    <Mic className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  )}
                </motion.button>

                {/* Text Input */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={localInput}
                    onChange={(e) => setLocalInput(e.target.value)}
                    placeholder="Ask me anything or click mic to speak..."
                    className="w-full h-12 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 pr-12 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  />
                  {localInput && (
                    <button
                      type="button"
                      onClick={() => setLocalInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Send Button */}
                <motion.button
                  type="submit"
                  disabled={!localInput.trim() || isLoading}
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-all',
                    localInput.trim() && !isLoading
                      ? 'bg-gradient-to-br from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600'
                      : 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed'
                  )}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="w-5 h-5 text-white" />
                </motion.button>
              </form>

              {/* Voice Status Bar */}
              <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-slate-400">
                <span className={cn(
                  'w-2 h-2 rounded-full',
                  isListening ? 'bg-red-500 animate-pulse' : isSpeaking ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                )} />
                <span>
                  {isListening ? 'Listening for your voice...' : isSpeaking ? 'Speaking response...' : 'Voice assistant ready'}
                </span>
                {voiceEnabled && <Volume2 className="w-3 h-3 ml-1" />}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}