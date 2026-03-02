import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useProfileId } from './useProfileId';
import type { TravelTime } from '../types/database';
import { toast } from 'sonner';

export function useTravelTimes() {
  const profileId = useProfileId();
  return useQuery({
    queryKey: ['travel_times', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('travel_times')
        .select('*')
        .eq('profile_id', profileId);
      if (error) throw error;
      return data as TravelTime[];
    },
  });
}

export function useUpsertTravelTime() {
  const profileId = useProfileId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tt: {
      from_location_id: string;
      to_location_id: string;
      duration_minutes: number;
    }) => {
      // Check if entry exists
      const { data: existing } = await supabase
        .from('travel_times')
        .select('id, entry_count, total_minutes')
        .eq('profile_id', profileId)
        .eq('from_location_id', tt.from_location_id)
        .eq('to_location_id', tt.to_location_id)
        .maybeSingle();

      if (existing) {
        // Update running average
        const newCount = existing.entry_count + 1;
        const newTotal = existing.total_minutes + tt.duration_minutes;
        const { data, error } = await supabase
          .from('travel_times')
          .update({
            duration_minutes: Math.round(newTotal / newCount),
            entry_count: newCount,
            total_minutes: newTotal,
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data as TravelTime;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('travel_times')
          .insert({
            profile_id: profileId,
            from_location_id: tt.from_location_id,
            to_location_id: tt.to_location_id,
            duration_minutes: tt.duration_minutes,
            entry_count: 1,
            total_minutes: tt.duration_minutes,
          })
          .select()
          .single();
        if (error) throw error;
        return data as TravelTime;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['travel_times'] });
    },
    onError: () => {
      toast.error('Failed to save travel time');
    },
  });
}
