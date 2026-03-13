import { supabase } from './supabase';
import { getToday } from './utils';

/**
 * A realistic generic demo-day schedule.
 * Optimized to showcase all 3 demo interactions:
 *   1. Grocery — gap after dentist for natural insertion
 *   2. Energy crash — 3 hard tasks to reschedule + blocks to shorten
 *   3. Reprioritization — several non-essential blocks to clear dramatically
 *
 * NOTE: Only uses columns that exist in the actual DB table:
 *   id, profile_id, task_id, category_id, title, date, start_time, end_time,
 *   duration_minutes, status, is_fixed, is_protected, is_transition, is_travel,
 *   is_prep, ai_reason, notes, completed_at
 */
export function getDemoBlocks(profileId: string, date?: string) {
  const d = date || getToday();

  const base = {
    profile_id: profileId, date: d,
    is_fixed: false, is_protected: false, is_transition: false,
    is_travel: false, is_prep: false,
    ai_reason: null as string | null, notes: null as string | null,
  };

  const breather = (start: string, end: string, status: 'completed' | 'pending' = 'pending') => ({
    ...base, title: 'Breather',
    start_time: start, end_time: end, duration_minutes: 5,
    status, is_transition: true,
    ai_reason: 'Breathing room between tasks',
  });

  return [
    // ── Morning (completed — viewer sees mid-day) ──
    {
      ...base, title: 'Wake up + morning routine',
      start_time: '07:30', end_time: '08:00', duration_minutes: 30,
      status: 'completed', is_protected: true,
      ai_reason: 'Morning routine',
    },
    {
      ...base, title: 'Breakfast',
      start_time: '08:00', end_time: '08:30', duration_minutes: 30,
      status: 'completed', is_protected: true,
      ai_reason: 'Breakfast',
    },
    {
      ...base, title: 'Reply to emails + messages',
      start_time: '08:30', end_time: '09:00', duration_minutes: 30,
      status: 'completed',
      ai_reason: 'Easy warmup — low effort start to the day',
    },

    breather('09:00', '09:05', 'completed'),

    {
      ...base, title: 'Work on research paper',
      start_time: '09:05', end_time: '10:05', duration_minutes: 60,
      status: 'completed',
      ai_reason: 'Peak morning energy — hard task first',
    },

    // ── Dentist Appointment (gap after for grocery demo) ──
    {
      ...base, title: 'Drive to dentist',
      start_time: '10:05', end_time: '10:25', duration_minutes: 20,
      status: 'pending', is_travel: true, is_protected: true,
      ai_reason: 'Travel to appointment',
    },
    {
      ...base, title: 'Dentist appointment',
      start_time: '10:30', end_time: '11:15', duration_minutes: 45,
      status: 'pending', is_fixed: true, is_protected: true,
      ai_reason: 'Fixed appointment',
    },
    {
      ...base, title: 'Drive home',
      start_time: '11:15', end_time: '11:35', duration_minutes: 20,
      status: 'pending', is_travel: true, is_protected: true,
      ai_reason: 'Travel home from dentist',
    },

    // ── Midday (pending — demo interaction zone) ──
    breather('11:35', '11:40'),

    {
      ...base, title: 'Lunch',
      start_time: '11:40', end_time: '12:10', duration_minutes: 30,
      status: 'pending', is_protected: true,
      ai_reason: 'Lunch break',
    },

    breather('12:10', '12:15'),

    {
      ...base, title: 'Study for exam — chapter 7 & 8',
      start_time: '12:15', end_time: '13:15', duration_minutes: 60,
      status: 'pending',
      ai_reason: 'Hard task — focused study session',
    },

    breather('13:15', '13:20'),

    {
      ...base, title: 'Clean kitchen + start laundry',
      start_time: '13:20', end_time: '13:50', duration_minutes: 30,
      status: 'pending',
      ai_reason: 'Chore block — movement break from desk work',
    },

    breather('13:50', '13:55'),

    {
      ...base, title: 'Finish group project slides',
      start_time: '13:55', end_time: '14:55', duration_minutes: 60,
      status: 'pending',
      ai_reason: 'Hard task — due tomorrow',
    },

    breather('14:55', '15:00'),

    {
      ...base, title: 'Call mom back',
      start_time: '15:00', end_time: '15:20', duration_minutes: 20,
      status: 'pending',
      ai_reason: 'Easy task — social connection break',
    },
    {
      ...base, title: 'Take care of the beardies',
      start_time: '15:20', end_time: '15:50', duration_minutes: 30,
      status: 'pending',
      ai_reason: 'Daily care — feeding, water, habitat check',
    },

    breather('15:50', '15:55'),

    {
      ...base, title: 'Work on budget spreadsheet',
      start_time: '15:55', end_time: '16:35', duration_minutes: 40,
      status: 'pending',
      ai_reason: 'Medium task — afternoon focus',
    },

    // ── Evening ──
    {
      ...base, title: 'Dinner',
      start_time: '17:00', end_time: '17:30', duration_minutes: 30,
      status: 'pending', is_protected: true,
      ai_reason: 'Dinner',
    },

    breather('17:30', '17:35'),

    {
      ...base, title: 'Read for class — 30 pages',
      start_time: '17:35', end_time: '18:15', duration_minutes: 40,
      status: 'pending',
      ai_reason: 'Medium task — reading assignment',
    },
    {
      ...base, title: 'Fold laundry + tidy living room',
      start_time: '18:15', end_time: '18:45', duration_minutes: 30,
      status: 'pending',
      ai_reason: 'Evening chores — easy wind-down activity',
    },

    breather('18:45', '18:50'),

    {
      ...base, title: 'Free time — relax, game, or scroll',
      start_time: '18:50', end_time: '20:00', duration_minutes: 70,
      status: 'pending',
      ai_reason: 'Earned downtime — recharge before bed',
    },

    breather('20:00', '20:05'),

    {
      ...base, title: 'Prep tomorrow — pack bag + lay out clothes',
      start_time: '20:05', end_time: '20:30', duration_minutes: 25,
      status: 'pending',
      ai_reason: 'Easy task — reduce morning friction',
    },

    breather('20:30', '20:35'),

    {
      ...base, title: 'Wind down — shower + nightly routine',
      start_time: '20:35', end_time: '21:05', duration_minutes: 30,
      status: 'pending', is_protected: true,
      ai_reason: 'Nightly routine',
    },
  ];
}

/**
 * Seeds the demo schedule into Supabase.
 * Called by the demo reset (Ctrl+Shift+D) to populate a realistic day.
 */
export async function seedDemoSchedule(profileId: string, date?: string): Promise<void> {
  const d = date || getToday();
  const blocks = getDemoBlocks(profileId, d);

  const { error } = await supabase
    .from('schedule_blocks')
    .insert(blocks);

  if (error) {
    console.error('Failed to seed demo schedule:', error);
    throw error;
  }
}

/**
 * Restores the demo schedule to its original state before a demo interaction.
 * Makes each interaction independent — they all start from the same clean slate.
 * Returns the fresh blocks from the DB so demo actions can operate on them.
 */
export async function restoreDemoSchedule(profileId: string, date?: string): Promise<import('../types/database').ScheduleBlock[]> {
  const d = date || getToday();

  // Wipe current blocks
  await supabase
    .from('schedule_blocks')
    .delete()
    .eq('profile_id', profileId)
    .eq('date', d);

  // Re-seed the original demo blocks
  await seedDemoSchedule(profileId, d);

  // Fetch and return the fresh blocks
  const { data, error } = await supabase
    .from('schedule_blocks')
    .select('*')
    .eq('profile_id', profileId)
    .eq('date', d)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return (data || []) as import('../types/database').ScheduleBlock[];
}
