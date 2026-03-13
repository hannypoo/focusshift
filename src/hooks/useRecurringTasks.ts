import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useProfileId } from './useProfileId';
import type { RecurringTask } from '../types/database';
import { toast } from 'sonner';

export function useRecurringTasks(enabledOnly = true) {
  const profileId = useProfileId();
  return useQuery({
    queryKey: ['recurring_tasks', profileId, enabledOnly],
    queryFn: async () => {
      let query = supabase
        .from('recurring_tasks')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at');
      if (enabledOnly) query = query.eq('enabled', true);
      const { data, error } = await query;
      if (error) throw error;
      return data as RecurringTask[];
    },
    enabled: !!profileId,
  });
}

export function useCreateRecurringTask() {
  const profileId = useProfileId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: Omit<RecurringTask, 'id' | 'created_at'>) => {
      if (!profileId) return;
      const { data, error } = await supabase
        .from('recurring_tasks')
        .insert({ ...task, profile_id: profileId })
        .select()
        .single();
      if (error) throw error;
      return data as RecurringTask;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring_tasks'] });
      toast.success('Recurring task created');
    },
    onError: () => {
      toast.error('Failed to create recurring task');
    },
  });
}

export function useUpdateRecurringTask() {
  const profileId = useProfileId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<RecurringTask>) => {
      if (!profileId) return;
      const { data, error } = await supabase
        .from('recurring_tasks')
        .update(updates)
        .eq('id', id)
        .eq('profile_id', profileId)
        .select()
        .single();
      if (error) throw error;
      return data as RecurringTask;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring_tasks'] });
    },
    onError: () => {
      toast.error('Failed to update recurring task');
    },
  });
}

export function useDeleteRecurringTask() {
  const profileId = useProfileId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!profileId) return;
      const { error } = await supabase
        .from('recurring_tasks')
        .delete()
        .eq('id', id)
        .eq('profile_id', profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring_tasks'] });
      toast.success('Recurring task deleted');
    },
    onError: () => {
      toast.error('Failed to delete recurring task');
    },
  });
}

/**
 * Generate task instances from recurring task templates for a given date.
 * Call this on app open to spawn today's recurring tasks if not already created.
 */
export async function spawnRecurringInstances(
  recurringTasks: RecurringTask[],
  date: string,
  existingTaskTitles: Set<string>,
  profileId: string
): Promise<Omit<import('../types/database').Task, 'id' | 'created_at' | 'updated_at'>[]> {
  const dow = new Date(date + 'T00:00:00').getDay();
  const newTasks: Omit<import('../types/database').Task, 'id' | 'created_at' | 'updated_at'>[] = [];

  for (const rt of recurringTasks) {
    // Check if this recurring task should fire today
    if (rt.days_of_week && !rt.days_of_week.includes(dow)) continue;

    // Check if already spawned today (by title + date)
    const instanceTitle = rt.title;
    if (existingTaskTitles.has(instanceTitle)) continue;

    newTasks.push({
      profile_id: profileId,
      title: instanceTitle,
      description: null,
      task_type: rt.task_type,
      priority: 'soon',
      status: 'scheduled',
      category_id: rt.category_id,
      estimated_minutes: rt.estimated_minutes,
      ai_estimated_minutes: null,
      actual_minutes: null,
      due_date: date,
      due_time: null,
      scheduled_date: date,
      scheduled_start_time: rt.is_flexible ? null : rt.start_time,
      scheduled_end_time: rt.is_flexible ? null : rt.end_time,
      location_id: rt.location_id,
      needs_travel: !!rt.location_id,
      prep_minutes: 0,
      homework_type: null,
      course_name: null,
      syllabus_text: null,
      difficulty_score: null,
      difficulty: null,
      is_multitaskable: false,
      is_recurring: true,
      recurring_task_id: rt.id,
    });
  }

  return newTasks;
}
