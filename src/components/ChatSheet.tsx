import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, ChevronUp, Bot, User, Mic } from 'lucide-react';
import { useChat, useChatHistory } from '../hooks/useChat';
import { useScheduleBlocks } from '../hooks/useScheduleBlocks';
import { useCategories } from '../hooks/useCategories';
import { useGoals } from '../hooks/useGoals';
import { getToday } from '../lib/utils';
import SuggestionChips from './SuggestionChips';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import type { Suggestion } from '../types';

interface ChatSheetProps {
  expanded: boolean;
  onToggle: () => void;
}

export default function ChatSheet({ expanded, onToggle }: ChatSheetProps) {
  const [input, setInput] = useState('');
  const { sendMessage, isLoading, suggestions, setSuggestions } = useChat();
  const { data: chatHistory } = useChatHistory();
  const { data: blocks } = useScheduleBlocks(getToday());
  const { data: categories } = useCategories();
  const { data: goals } = useGoals();
  const scrollRef = useRef<HTMLDivElement>(null);
  const handleSendRef = useRef<(msg?: string) => void>(() => {});

  // Voice input — auto-send when speech finishes
  const handleVoiceResult = useCallback((transcript: string) => {
    handleSendRef.current(transcript);
  }, []);
  const { listening, interim, supported: micSupported, toggle: toggleMic } = useSpeechRecognition(handleVoiceResult);

  // Scroll to bottom when new messages appear
  useEffect(() => {
    if (expanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, expanded]);

  const handleSend = async (message?: string) => {
    const text = message || input.trim();
    if (!text || isLoading) return;

    setInput('');
    setSuggestions([]);

    const context = {
      today: getToday(),
      blocks: blocks?.map((b) => ({
        title: b.title,
        time: `${b.start_time}-${b.end_time}`,
        status: b.status,
        category: b.category_id,
      })),
      categories: categories?.map((c) => ({ id: c.id, name: c.name })),
      goals: goals?.map((g) => ({ title: g.title, progress: `${g.current_count}/${g.target_count}` })),
    };

    const history = (chatHistory || []).slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    await sendMessage(text, context, history, blocks || []);
  };

  handleSendRef.current = handleSend;

  const handleSuggestion = (suggestion: Suggestion) => {
    if (suggestion.action.type === 'send_message') {
      handleSend((suggestion.action as { message: string }).message);
    }
  };

  // Collapsed: just show the input bar
  if (!expanded) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-lg border-t border-white/5 px-3 py-2">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <button
            onClick={onToggle}
            className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-colors"
            aria-label="Expand chat"
          >
            <ChevronUp size={18} />
          </button>
          <input
            type="text"
            value={listening ? (interim || 'Listening...') : input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={listening ? 'Listening...' : 'Ask Nudgley...'}
            className={`flex-1 h-10 bg-white/5 rounded-xl px-3 text-sm text-white placeholder:text-white/20 border outline-none transition-colors ${
              listening ? 'border-red-500/40 bg-red-500/5' : 'border-white/5'
            }`}
            readOnly={listening}
          />
          {micSupported && (
            <button
              onClick={toggleMic}
              disabled={isLoading}
              className={`p-2 rounded-xl transition-all ${
                listening
                  ? 'bg-red-500 hover:bg-red-400 text-white animate-pulse'
                  : 'bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70'
              }`}
              aria-label={listening ? 'Stop listening' : 'Voice input'}
            >
              <Mic size={18} />
            </button>
          )}
          <button
            onClick={() => handleSend()}
            disabled={(!input.trim() && !listening) || isLoading}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white transition-colors"
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    );
  }

  // Expanded: full chat sheet
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/98 backdrop-blur-lg animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Offload AI</h2>
        </div>
        <button
          onClick={onToggle}
          className="p-2 rounded-xl hover:bg-white/10 text-white/40 transition-colors"
          aria-label="Close chat"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {(!chatHistory || chatHistory.length === 0) && (
          <div className="text-center py-8">
            <Bot size={40} className="text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">Hey! I'm your schedule assistant.</p>
            <p className="text-white/20 text-xs mt-1">Ask me anything about your day.</p>
          </div>
        )}

        {chatHistory?.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={14} className="text-indigo-400" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-white/80 border border-white/5'
              }`}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <User size={14} className="text-white/50" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-indigo-400" />
            </div>
            <div className="bg-white/5 rounded-2xl px-4 py-3 border border-white/5">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}

        {/* Suggestion chips */}
        <SuggestionChips suggestions={suggestions} onSelect={handleSuggestion} />
      </div>

      {/* Input */}
      <div className="border-t border-white/5 px-4 py-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}>
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <input
            type="text"
            value={listening ? (interim || 'Listening...') : input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={listening ? 'Listening...' : 'Type or tap mic...'}
            className={`flex-1 h-12 bg-white/5 rounded-2xl px-4 text-sm text-white placeholder:text-white/20 border outline-none transition-colors ${
              listening ? 'border-red-500/40 bg-red-500/5' : 'border-white/5 focus:border-indigo-500/40'
            }`}
            readOnly={listening}
            autoFocus
          />
          {micSupported && (
            <button
              onClick={toggleMic}
              disabled={isLoading}
              className={`h-12 w-12 flex items-center justify-center rounded-2xl transition-all ${
                listening
                  ? 'bg-red-500 hover:bg-red-400 text-white animate-pulse'
                  : 'bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70'
              }`}
              aria-label={listening ? 'Stop listening' : 'Voice input'}
            >
              <Mic size={18} />
            </button>
          )}
          <button
            onClick={() => handleSend()}
            disabled={(!input.trim() && !listening) || isLoading}
            className="h-12 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white font-medium text-sm transition-colors"
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
