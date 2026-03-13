import type { ScheduleBlock } from '../types/database';

/**
 * Enriches schedule blocks with derived properties that the DB doesn't have yet.
 * The TimeBlockCard component checks is_meal, is_self_care, is_buffer, is_chore_block,
 * block_type, and difficulty — but these columns don't exist in the DB.
 * This function infers them from title and ai_reason so the UI renders correctly.
 */
export function enrichBlocks(blocks: ScheduleBlock[]): ScheduleBlock[] {
  return blocks.map((b) => {
    const title = b.title.toLowerCase();
    const reason = (b.ai_reason || '').toLowerCase();

    // Infer is_meal
    const is_meal = title.includes('breakfast') || title.includes('lunch') || title.includes('dinner');

    // Infer is_self_care
    const is_self_care = title.includes('wake up') || title.includes('morning routine') ||
      title.includes('wind down') || title.includes('nightly routine') ||
      title.includes('shower') || title.includes('skincare') ||
      title.includes('energy break') || reason.includes('self-care');

    // Infer is_buffer / is_transition (breather blocks)
    const is_buffer = title === 'breather' || b.is_transition;

    // Infer is_chore_block
    const is_chore_block = title.includes('clean') || title.includes('laundry') ||
      title.includes('tidy') || title.includes('fold') ||
      reason.includes('chore');

    // Infer difficulty from ai_reason
    let difficulty: string | null = null;
    if (reason.includes('hard task') || reason.includes('peak morning energy')) {
      difficulty = 'hard';
    } else if (reason.includes('medium task')) {
      difficulty = 'medium';
    } else if (reason.includes('easy') || reason.includes('low effort')) {
      difficulty = 'easy';
    }

    // Infer block_type
    let block_type = 'task';
    if (is_meal) block_type = 'meal';
    else if (is_self_care) block_type = 'self_care';
    else if (is_buffer) block_type = 'buffer';
    else if (is_chore_block) block_type = 'chore';
    else if (b.is_travel) block_type = 'travel';
    else if (b.is_prep) block_type = 'prep';
    else if (b.is_fixed) block_type = 'appointment';
    else if (reason.includes('homework') || reason.includes('study') || reason.includes('reading')) block_type = 'homework';

    return {
      ...b,
      is_meal,
      is_self_care,
      is_buffer,
      is_chore_block,
      block_type,
      difficulty,
    } as ScheduleBlock;
  });
}
