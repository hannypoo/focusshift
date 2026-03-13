import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useProfileId } from './useProfileId';
import type { DailyCheckin, WeeklyCheckin } from '../types/database';
import { toast } from 'sonner';
import { getToday } from '../lib/utils';
import { getWeekStart } from '../lib/dateUtils';

export function useDailyCheckin(date?: string) {
  const profileId = useProfileId();
  const d = date || getToday();
  return useQuery({
    queryKey: ['daily_checkin', d, profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('profile_id', profileId)
        .eq('date', d)
        .maybeSingle();
      if (error) throw error;
      return data as DailyCheckin | null;
    },
    enabled: !!profileId,
  });
}

export function useUpsertDailyCheckin() {
  const profileId = useProfileId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (checkin: {
      date: string;
      energy_level: 'low' | 'medium' | 'high';
      wake_time?: string;
      wind_down_time?: string;
      notes?: string;
    }) => {
      if (!profileId) return;
      const { data, error } = await supabase
        .from('daily_checkins')
        .upsert(
          { ...checkin, profile_id: profileId },
          { onConflict: 'profile_id,date' }
        )
        .select()
        .single();
      if (error) throw error;
      return data as DailyCheckin;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['daily_checkin', data.date] });
    },
  });
}

export function useWeeklyCheckin(weekStart?: string) {
  const profileId = useProfileId();
  const week = weekStart || getWeekStart();
  return useQuery({
    queryKey: ['weekly_checkin', week, profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_checkins')
        .select('*')
        .eq('profile_id', profileId)
        .eq('week_start', week)
        .maybeSingle();
      if (error) throw error;
      return data as WeeklyCheckin | null;
    },
    enabled: !!profileId,
  });
}

export function useUpsertWeeklyCheckin() {
  const profileId = useProfileId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (checkin: Omit<WeeklyCheckin, 'id' | 'created_at' | 'profile_id'>) => {
      if (!profileId) return;
      const { data, error } = await supabase
        .from('weekly_checkins')
        .upsert(
          { ...checkin, profile_id: profileId },
          { onConflict: 'profile_id,week_start' }
        )
        .select()
        .single();
      if (error) throw error;
      return data as WeeklyCheckin;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weekly_checkin'] });
      toast.success('Weekly check-in saved');
    },
    onError: () => {
      toast.error('Failed to save check-in');
    },
  });
}
