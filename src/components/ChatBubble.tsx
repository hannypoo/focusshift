import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, Bot, User, MessageCircle, Mic } from 'lucide-react';
import { useChat, useChatHistory } from '../hooks/useChat';
import { useScheduleBlocks } from '../hooks/useScheduleBlocks';
import { useCategories } from '../hooks/useCategories';
import { useGoals } from '../hooks/useGoals';
import { useProfile } from '../hooks/useProfile';
import { useRewards } from '../hooks/useRewards';
import { getToday } from '../lib/utils';
import SuggestionChips from './SuggestionChips';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import type { Suggestion } from '../types';

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { sendMessage, isLoading, suggestions, setSuggestions } = useChat();
  const { data: chatHistory } = useChatHistory();
  const { data: blocks } = useScheduleBlocks(getToday());
  const { data: categories } = useCategories();
  const { data: goals } = useGoals();
  const { data: profile } = useProfile();
  const { data: rewards } = useRewards(getToday());
  const scrollRef = useRef<HTMLDivElement>(null);
  const handleSendRef = useRef<(msg?: string) => void>(() => {});

  // Voice input — auto-send when speech finishes
  const handleVoiceResult = useCallback((transcript: string) => {
    handleSendRef.current(transcript);
  }, []);
  const { listening, wakeListening, wakeWordEnabled, interim, supported: micSupported, toggle: toggleMic, toggleWakeWord } = useSpeechRecognition(handleVoiceResult);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, open]);

  const handleSend = async (message?: string) => {
    const text = message || input.trim();
    if (!text || isLoading) return;
    setInput('');
    setSuggestions([]);

    const context = {
      today: getToday(),
      blocks: blocks?.map((b) => ({
        title: b.title, time: `${b.start_time}-${b.end_time}`, status: b.status,
        category: b.category_id, difficulty: b.difficulty, block_type: b.block_type,
      })),
      categories: categories?.map((c) => ({ id: c.id, name: c.name })),
      goals: goals?.map((g) => ({ title: g.title, progress: `${g.current_count}/${g.target_count}` })),
      rewards_earned: rewards?.length || 0,
      treats: profile?.treats || [],
      productivity_zones: profile?.productivity_zones || [],
      streak: profile?.streak || 0,
    };
    const history = (chatHistory || []).slice(-6).map((m) => ({ role: m.role, content: m.content }));
    await sendMessage(text, context, history, blocks || []);
  };

  // Keep ref in sync for voice callback
  handleSendRef.current = handleSend;

  const handleSuggestion = (suggestion: Suggestion) => {
    if (suggestion.action.type === 'send_message') {
      handleSend((suggestion.action as { message: string }).message);
    }
  };

  // Floating bubble
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-40 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 flex items-center justify-center transition-all hover:scale-105"
        aria-label="Open chat"
      >
        <MessageCircle size={22} className="text-white" />
      </button>
    );
  }

  // Expanded panel
  return (
    <>
      {/* Mobile: full overlay. Desktop: slide-in panel */}
      <div className="fixed inset-0 z-50 sm:inset-auto sm:top-0 sm:right-0 sm:w-80 sm:h-full flex flex-col bg-slate-950/98 sm:bg-slate-950 backdrop-blur-lg sm:border-l sm:border-white/5">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Bot size={20} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Nudgley</h2>
            {wakeListening && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400/70">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                listening
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {micSupported && (
              <button
                onClick={toggleWakeWord}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                  wakeWordEnabled
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/5 text-white/30 hover:text-white/50 border border-white/5'
                }`}
                aria-label={wakeWordEnabled ? 'Disable voice activation' : 'Enable voice activation'}
                title={wakeWordEnabled ? '"Hey Nudgley" is on' : 'Enable "Hey Nudgley"'}
              >
                <Mic size={10} className="inline mr-1" />
                {wakeWordEnabled ? 'Voice On' : 'Voice'}
              </button>
            )}
            <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-white/10 text-white/40" aria-label="Close chat">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {(!chatHistory || chatHistory.length === 0) && (
            <div className="text-center py-8">
              <Bot size={40} className="text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">Hey! I'm Nudgley, your schedule sidekick.</p>
              <p className="text-white/20 text-xs mt-1">Type, tap the mic, or say "Hey Nudgley" to get started.</p>
            </div>
          )}

          {chatHistory?.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={12} className="text-indigo-400" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-white/80 border border-white/5'
              }`}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={12} className="text-white/50" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                <Bot size={12} className="text-indigo-400" />
              </div>
              <div className="bg-white/5 rounded-2xl px-3 py-2.5 border border-white/5">
                <div className="flex gap-1.5 py-1">
                  <div className="w-2 h-2 rounded-full bg-indigo-400/40 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-indigo-400/40 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 rounded-full bg-indigo-400/40 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}

          <SuggestionChips suggestions={suggestions} onSelect={handleSuggestion} />
        </div>

        {/* Input */}
        <div className="border-t border-white/5 px-3 py-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={listening ? (interim || 'Listening...') : input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={listening ? 'Listening...' : 'Type or tap mic...'}
              className={`flex-1 h-10 bg-white/5 rounded-xl px-3 text-sm text-white placeholder:text-white/20 border outline-none transition-colors ${
                listening ? 'border-red-500/40 bg-red-500/5' : 'border-white/5 focus:border-indigo-500/40'
              }`}
              readOnly={listening}
              autoFocus
            />
            {micSupported && (
              <button
                onClick={toggleMic}
                disabled={isLoading}
                className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all ${
                  listening
                    ? 'bg-red-500 hover:bg-red-400 text-white animate-pulse'
                    : 'bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70'
                }`}
                aria-label={listening ? 'Stop listening' : 'Voice input'}
              >
                <Mic size={16} />
              </button>
            )}
            <button
              onClick={() => handleSend()}
              disabled={(!input.trim() && !listening) || isLoading}
              className="h-10 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
