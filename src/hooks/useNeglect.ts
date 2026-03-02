import { useMemo } from 'react';
import type { ScheduleBlock } from '../types/database';
import type { Category, CategoryStats, DayRecord, NeglectInfo } from '../types';
import { computeNeglectScore } from '../lib/neglect';
import { addDays, getToday } from '../lib/utils';

/**
 * Compute neglect scores from schedule blocks (Supabase data).
 * Adapts the v1 neglect algorithm to work with DB-sourced blocks.
 */
export function useNeglect(
  categories: Category[] | undefined,
  blocks: ScheduleBlock[] | undefined
): NeglectInfo[] {
  return useMemo(() => {
    if (!categories || !blocks) return [];

    const today = getToday();
    const oneWeekAgo = addDays(today, -7);

    return categories
      .filter((c) => c.enabled && c.weeklyMinMinutes !== null)
      .map((cat) => {
        const catBlocks = blocks.filter((b) => b.category_id === cat.id && !b.is_transition);

        // Build 2-week history
        const twoWeekHistory: DayRecord[] = [];
        for (let i = -13; i <= 0; i++) {
          const date = addDays(today, i);
          const dayBlocks = catBlocks.filter((b) => b.date === date);
          twoWeekHistory.push({
            date,
            minutesCompleted: dayBlocks.filter((b) => b.status === 'completed').reduce((s, b) => s + b.duration_minutes, 0),
            minutesPlanned: dayBlocks.reduce((s, b) => s + b.duration_minutes, 0),
            blocksCompleted: dayBlocks.filter((b) => b.status === 'completed').length,
            blocksPlanned: dayBlocks.length,
          });
        }

        // Weekly minutes (last 7 days)
        const weekHistory = twoWeekHistory.filter((d) => d.date >= oneWeekAgo);
        const weeklyMinutesCompleted = weekHistory.reduce((s, d) => s + d.minutesCompleted, 0);

        // Consecutive days skipped
        let consecutiveDaysSkipped = 0;
        for (let i = twoWeekHistory.length - 1; i >= 0; i--) {
          if (twoWeekHistory[i].minutesCompleted === 0) {
            consecutiveDaysSkipped++;
          } else {
            break;
          }
        }

        const lastCompletedDay = [...twoWeekHistory].reverse().find((d) => d.minutesCompleted > 0);

        const stats: CategoryStats = {
          categoryId: cat.id,
          weeklyMinutesCompleted: weeklyMinutesCompleted,
          weeklyMinutesTarget: cat.weeklyMinMinutes,
          consecutiveDaysSkipped,
          neglectScore: 0,
          lastCompletedDate: lastCompletedDay?.date || null,
          twoWeekHistory,
        };

        stats.neglectScore = computeNeglectScore(stats, cat);

        return {
          categoryId: cat.id,
          categoryName: cat.name,
          color: cat.color,
          score: stats.neglectScore,
          weeklyMinutes: weeklyMinutesCompleted,
          weeklyTarget: cat.weeklyMinMinutes,
          consecutiveDaysSkipped,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [categories, blocks]);
}
