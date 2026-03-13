import { supabase } from './supabase';
import { minutesToTime, parseTimeToMinutes } from './utils';
import type { ScheduleAction } from '../types';
import type { ScheduleBlock } from '../types/database';

// Helper: detect block purpose from ai_reason + flags since DB lacks typed columns
function isHardTask(b: ScheduleBlock): boolean {
  const reason = (b.ai_reason || '').toLowerCase();
  return reason.includes('hard task') || reason.includes('peak morning energy');
}

function isMealOrSelfCare(b: ScheduleBlock): boolean {
  const reason = (b.ai_reason || '').toLowerCase();
  const title = b.title.toLowerCase();
  return reason.includes('breakfast') || reason.includes('lunch') ||
    reason.includes('dinner') || reason.includes('morning routine') ||
    reason.includes('nightly routine') || title.includes('breakfast') ||
    title.includes('lunch') || title.includes('dinner') ||
    title.includes('wind down') || title.includes('wake up');
}

function isBuffer(b: ScheduleBlock): boolean {
  return b.is_transition || b.title === 'Breather';
}

/**
 * Find insertion point after a fixed block by skipping only travel, transitions, and meals.
 * Stops at the first regular task — that's where we can insert.
 * E.g., after dentist: drive home (travel) → breather → lunch (meal) → breather → STOP.
 */
function findInsertAfterFixed(blocks: ScheduleBlock[], afterMin: number): number {
  const sorted = [...blocks]
    .filter((b) => b.status !== 'rescheduled' && b.status !== 'skipped')
    .sort((a, b) => parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time));

  let insertAt = afterMin;

  for (const block of sorted) {
    const start = parseTimeToMinutes(block.start_time);
    const end = parseTimeToMinutes(block.end_time);

    // Only consider blocks that start near our current position
    if (start < afterMin) continue;
    if (start > insertAt + 10) break; // gap too large, we've found our spot

    // Skip travel, transitions, and meals — they're part of the "appointment cluster"
    if (block.is_travel || block.is_transition || block.is_fixed || isMealOrSelfCare(block)) {
      insertAt = Math.max(insertAt, end);
    } else {
      // Hit a regular task — insert before it
      break;
    }
  }

  return insertAt;
}

/**
 * Executes demo actions that modify the schedule visually.
 * Each action type maps to a real Supabase mutation so the timeline updates.
 */
export async function executeDemoActions(
  actions: ScheduleAction[],
  blocks: ScheduleBlock[],
  profileId: string,
  date: string
): Promise<void> {
  for (const action of actions) {
    const data = action.data as Record<string, unknown> | undefined;
    if (!data) continue;

    // Reschedule hard tasks
    if (data.rescheduleHard) {
      const hardBlocks = blocks.filter(
        (b) => isHardTask(b) && b.status === 'pending'
      );
      for (const block of hardBlocks) {
        const { error } = await supabase
          .from('schedule_blocks')
          .update({ status: 'rescheduled' })
          .eq('id', block.id);
        if (error) console.error('Failed to reschedule block:', error);
      }
      continue;
    }

    // Shorten remaining pending blocks by 40%
    if (data.shortenBlocks) {
      const pendingBlocks = blocks.filter(
        (b) => b.status === 'pending' && !b.is_fixed && !isMealOrSelfCare(b) && !isBuffer(b) && !isHardTask(b)
      );
      for (const block of pendingBlocks) {
        const newDuration = Math.max(15, Math.round(block.duration_minutes * 0.6));
        const startMin = parseTimeToMinutes(block.start_time);
        const newEnd = minutesToTime(startMin + newDuration);
        const { error } = await supabase
          .from('schedule_blocks')
          .update({
            duration_minutes: newDuration,
            end_time: newEnd,
          })
          .eq('id', block.id);
        if (error) console.error('Failed to shorten block:', error);
      }
      continue;
    }

    // Clear non-essential pending blocks
    if (data.clearNonEssential) {
      const nonEssential = blocks.filter(
        (b) =>
          b.status === 'pending' &&
          !b.is_fixed &&
          !b.is_protected &&
          !isMealOrSelfCare(b)
      );
      for (const block of nonEssential) {
        const { error } = await supabase
          .from('schedule_blocks')
          .update({ status: 'rescheduled' })
          .eq('id', block.id);
        if (error) console.error('Failed to clear block:', error);
      }
      continue;
    }

    // Create a new block (grocery, energy break, quick prep, etc.)
    if (data.title) {
      const duration = (data.duration as number) || 30;

      // Use demo schedule context to find insertion point
      let insertMin: number;
      if (data.priority) {
        // Priority: insert between last completed block and first pending block
        // "Get ready" should appear as the very next thing to do
        const completed = blocks
          .filter((b) => b.status === 'completed')
          .sort((a, b) => parseTimeToMinutes(a.end_time) - parseTimeToMinutes(b.end_time));
        const lastDone = completed[completed.length - 1];
        insertMin = lastDone
          ? parseTimeToMinutes(lastDone.end_time)
          : 480;
      } else {
        // Non-priority: insert after the cluster following the fixed block
        // (e.g., grocery goes after dentist → drive home → breather → lunch cluster)
        const fixedBlocks = blocks
          .filter((b) => b.is_fixed && b.status === 'pending')
          .sort((a, b) => parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time));
        const afterFixed = fixedBlocks[0];
        const fixedEnd = afterFixed ? parseTimeToMinutes(afterFixed.end_time) : 720;
        // Skip past travel, transitions, and meals after the fixed block
        insertMin = findInsertAfterFixed(blocks, fixedEnd);
      }

      const startTime = minutesToTime(insertMin);
      const endTime = minutesToTime(insertMin + duration);

      // Build ai_reason with hints so blockEnricher picks up the right type
      let aiReason = 'Added by Nudgley';
      if (data.isSelfCare) aiReason = 'Self-care — added by Nudgley';
      if (data.category === 'errands') aiReason = 'Errand — added by Nudgley';

      const { error } = await supabase.from('schedule_blocks').insert({
        profile_id: profileId,
        title: data.title as string,
        date,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: duration,
        status: 'pending',
        is_fixed: false,
        is_protected: false,
        is_transition: false,
        is_travel: false,
        is_prep: false,
        ai_reason: aiReason,
      });
      if (error) console.error('Failed to create block:', error);
    }
  }
}
