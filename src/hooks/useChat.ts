import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useProfileId } from './useProfileId';
import type { ChatMessage } from '../types/database';
import type { ChatResponse, Suggestion } from '../types';

export function useChatHistory() {
  const profileId = useProfileId();
  return useQuery({
    queryKey: ['chat_messages', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: true })
        .limit(50);
      if (error) throw error;
      return data as ChatMessage[];
    },
  });
}

export function useChat() {
  const profileId = useProfileId();
  const qc = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const sendMessage = useCallback(async (
    message: string,
    context: Record<string, unknown> = {},
    history: { role: string; content: string }[] = []
  ): Promise<ChatResponse | null> => {
    setIsLoading(true);

    try {
      // Save user message to DB
      await supabase.from('chat_messages').insert({
        profile_id: profileId,
        role: 'user',
        content: message,
      });

      // Call edge function
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { message, context, history },
      });

      if (error) throw error;

      const response = data as ChatResponse;

      // Save assistant response to DB
      await supabase.from('chat_messages').insert({
        profile_id: profileId,
        role: 'assistant',
        content: response.message,
        metadata: {
          actions: response.actions,
          suggestions: response.suggestions,
        },
      });

      setSuggestions(response.suggestions || []);

      // Refresh chat history
      qc.invalidateQueries({ queryKey: ['chat_messages'] });

      return response;
    } catch (err) {
      console.error('Chat error:', err);
      return {
        message: "I'm having trouble right now. Try again in a moment.",
        suggestions: [],
      };
    } finally {
      setIsLoading(false);
    }
  }, [qc, profileId]);

  return { sendMessage, isLoading, suggestions, setSuggestions };
}
