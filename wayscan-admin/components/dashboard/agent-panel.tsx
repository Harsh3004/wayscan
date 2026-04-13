// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@ai-sdk/react';
import { Mic, Send, X, Bot, Loader2 } from 'lucide-react';
import { FilterState } from '@/lib/types';

interface AgentPanelProps {
  onUpdateFilters: (filters: Partial<FilterState>) => void;
  onSetMapCenter: (lat: number, lng: number) => void;
  onSelectPothole: (id: string) => void;
}

export default function AgentPanel({ onUpdateFilters, onSetMapCenter, onSelectPothole }: AgentPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [localInput, setLocalInput] = useState('');

  // @ts-ignore
  const { messages = [], sendMessage, isLoading, error } = useChat({
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
        onUpdateFilters(newFilters);
      } else if (toolCall.toolName === 'setMapCenter') {
        onSetMapCenter(args.lat, args.lng);
      } else if (toolCall.toolName === 'selectPothole') {
        onSelectPothole(args.id);
      }
    },
    onFinish: (event: any) => {
      // In newer AI SDK, the message is nested inside an event object
      const message = event?.message || event;
      const speechText = message.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || message.content || '';
      if (speechText && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(speechText);
        window.speechSynthesis.speak(utterance);
      }
    }
  }) as any;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onstart = () => setIsListening(true);
        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setLocalInput((prev) => prev ? prev + ' ' + transcript : transcript);
        };
      }
    }
  }, []);

  const toggleListen = () => {
    try {
      if (isListening) {
        recognitionRef.current?.stop();
      } else {
        recognitionRef.current?.start();
      }
    } catch (e) {
      console.warn("Speech recognition error:", e);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localInput.trim()) return;
    sendMessage({ text: localInput });
    setLocalInput('');
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 transition-all z-50 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 scale-100 hover:scale-110'}`}
      >
        <Bot className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-96 h-[600px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100">WayScan AI</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                  {error.message || 'The agent could not complete that request.'}
                </div>
              )}
              {messages.length === 0 && (
                <div className="text-center text-sm text-slate-500 mt-10">
                  <Bot className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  Hi! I'm your dashboard assistant. Ask me to quickly filter priorities or focus the map on a city.
                </div>
              )}
              {messages.filter((m: any) => m.role !== 'tool' && m.role !== 'system').map((m: any) => {
                const textContent = m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || m.content || '';
                const hasToolInvocations = m.parts?.some((p: any) => p.type && p.type.startsWith('tool-')) || m.toolInvocations;

                return (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.role === 'assistant' && <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2 shrink-0"><Bot className="w-3 h-3 text-blue-600" /></div>}
                    <div className={`px-4 py-2 rounded-2xl text-sm max-w-[80%] ${
                      m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                    }`}>
                      {textContent || (hasToolInvocations ? <span className="italic text-slate-500 text-xs text-opacity-70">Executing view changes...</span> : null)}
                    </div>
                  </div>
                );
              })}
              {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                <div className="flex justify-start items-center text-slate-500 text-sm">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Thinking...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleListen}
                  className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={localInput}
                  onChange={(e) => setLocalInput(e.target.value)}
                  placeholder="Ask the dashboard AI..."
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!localInput.trim()}
                  className="p-2 rounded-xl bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
