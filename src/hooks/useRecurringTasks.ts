import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useProfileId } from './useProfileId';
import type { RecurringTask } from '../types/database';
import { toast } from 'sonner';

export function useRecurringTasks() {
  const profileId = useProfileId();
  return useQuery({
    queryKey: ['recurring_tasks', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_tasks')
        .select('*')
        .eq('profile_id', profileId)
        .eq('enabled', true)
        .order('created_at');
      if (error) throw error;
      return data as RecurringTask[];
    },
  });
}

export function useCreateRecurringTask() {
  const profileId = useProfileId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: Omit<RecurringTask, 'id' | 'created_at'>) => {
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
      scheduled_start_time: rt.start_time,
      scheduled_end_time: rt.end_time,
      location_id: rt.location_id,
      needs_travel: false,
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
