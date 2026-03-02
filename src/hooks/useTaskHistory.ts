import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useProfileId } from './useProfileId';
import type { TaskHistory } from '../types/database';

export function useTaskHistory(categoryId?: string) {
  const profileId = useProfileId();
  return useQuery({
    queryKey: ['task_history', categoryId, profileId],
    queryFn: async () => {
      let query = supabase
        .from('task_history')
        .select('*')
        .eq('profile_id', profileId)
        .order('completed_at', { ascending: false })
        .limit(100);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TaskHistory[];
    },
  });
}

export function useRecordTaskHistory() {
  const profileId = useProfileId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Omit<TaskHistory, 'id' | 'completed_at'>) => {
      const { data, error } = await supabase
        .from('task_history')
        .insert({ ...entry, profile_id: profileId })
        .select()
        .single();
      if (error) throw error;
      return data as TaskHistory;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task_history'] });
    },
  });
}
