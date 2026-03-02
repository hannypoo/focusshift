import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useProfileId } from './useProfileId';
import type { DailySummary } from '../types/database';
import { toast } from 'sonner';

export function useDailySummary(date?: string) {
  const profileId = useProfileId();
  return useQuery({
    queryKey: ['daily_summary', date, profileId],
    enabled: !!date,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('profile_id', profileId)
        .eq('date', date!)
        .maybeSingle();
      if (error) throw error;
      return data as DailySummary | null;
    },
  });
}

export function useUpsertDailySummary() {
  const profileId = useProfileId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (summary: {
      date: string;
      blocks_completed?: number;
      blocks_missed?: number;
      blocks_skipped?: number;
      total_productive_minutes?: number;
      hard_tasks_completed?: number;
      ai_summary?: string;
      mood_rating?: number;
      user_notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('daily_summaries')
        .upsert(
          { ...summary, profile_id: profileId },
          { onConflict: 'profile_id,date' }
        )
        .select()
        .single();
      if (error) throw error;
      return data as DailySummary;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['daily_summary', vars.date] });
    },
    onError: () => {
      toast.error('Failed to save daily summary');
    },
  });
}

export function useRecentSummaries(days: number = 7) {
  const profileId = useProfileId();
  return useQuery({
    queryKey: ['daily_summaries_recent', days, profileId],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceStr = since.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('profile_id', profileId)
        .gte('date', sinceStr)
        .order('date', { ascending: false });
      if (error) throw error;
      return data as DailySummary[];
    },
  });
}
