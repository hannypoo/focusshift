import type { AppState, Category, CategoryStats, DayRecord } from '../types';
import { getToday, addDays } from './utils';

/**
 * Neglect score (0-100) based on:
 *  - Weekly deficit vs. minimum target (40%)
 *  - Consecutive days skipped (30%)
 *  - Skip ratio over 2 weeks (20%)
 *  - Worsening trend (10%)
 */
export function computeNeglectScore(stats: CategoryStats, category: Category): number {
  if (!category.enabled || category.weeklyMinMinutes === null) return 0;

  // 1. Weekly deficit (40%)
  const target = category.weeklyMinMinutes;
  const deficit = Math.max(0, target - stats.weeklyMinutesCompleted);
  const deficitRatio = target > 0 ? deficit / target : 0;
  const deficitScore = Math.min(deficitRatio * 100, 100) * 0.4;

  // 2. Consecutive days skipped (30%)
  // 1 day = 10, 2 days = 30, 3 days = 60, 4+ = 90-100
  const skipDays = stats.consecutiveDaysSkipped;
  const skipDayScore = Math.min(skipDays * 25, 100) * 0.3;

  // 3. Skip ratio over 2 weeks (20%)
  const totalDays = stats.twoWeekHistory.length;
  if (totalDays === 0) return deficitScore + skipDayScore;
  const daysWithCompletion = stats.twoWeekHistory.filter((d) => d.minutesCompleted > 0).length;
  const skipRatio = 1 - daysWithCompletion / Math.max(totalDays, 1);
  const skipRatioScore = skipRatio * 100 * 0.2;

  // 4. Worsening trend (10%) — compare last 3 days to prior 3 days
  const recent3 = stats.twoWeekHistory.slice(-3);
  const prior3 = stats.twoWeekHistory.slice(-6, -3);
  const recentAvg = recent3.length > 0 ? recent3.reduce((s, d) => s + d.minutesCompleted, 0) / recent3.length : 0;
  const priorAvg = prior3.length > 0 ? prior3.reduce((s, d) => s + d.minutesCompleted, 0) / prior3.length : 0;
  const trendScore = priorAvg > 0 && recentAvg < priorAvg
    ? Math.min(((priorAvg - recentAvg) / priorAvg) * 100, 100) * 0.1
    : 0;

  return Math.round(Math.min(deficitScore + skipDayScore + skipRatioScore + trendScore, 100));
}

export function getCategoryStats(state: AppState, categoryId: string): CategoryStats {
  const today = getToday();
  const oneWeekAgo = addDays(today, -7);

  const category = state.categories.find((c) => c.id === categoryId)!;

  // Build 2-week daily history
  const twoWeekHistory: DayRecord[] = [];
  for (let i = -13; i <= 0; i++) {
    const date = addDays(today, i);
    const plan = state.dayPlans.find((p) => p.date === date);
    const blocks = plan?.blocks.filter((b) => b.categoryId === categoryId && !b.isTransition) || [];
    twoWeekHistory.push({
      date,
      minutesCompleted: blocks.filter((b) => b.status === 'completed').reduce((s, b) => s + b.durationMinutes, 0),
      minutesPlanned: blocks.reduce((s, b) => s + b.durationMinutes, 0),
      blocksCompleted: blocks.filter((b) => b.status === 'completed').length,
      blocksPlanned: blocks.length,
    });
  }

  // Weekly minutes (last 7 days)
  const weekHistory = twoWeekHistory.filter((d) => d.date >= oneWeekAgo);
  const weeklyMinutesCompleted = weekHistory.reduce((s, d) => s + d.minutesCompleted, 0);

  // Consecutive days skipped (counting back from today)
  let consecutiveDaysSkipped = 0;
  for (let i = twoWeekHistory.length - 1; i >= 0; i--) {
    if (twoWeekHistory[i].minutesCompleted === 0) {
      consecutiveDaysSkipped++;
    } else {
      break;
    }
  }

  // Last completed date
  const lastCompletedDay = [...twoWeekHistory].reverse().find((d) => d.minutesCompleted > 0);

  const stats: CategoryStats = {
    categoryId,
    weeklyMinutesCompleted,
    weeklyMinutesTarget: category.weeklyMinMinutes,
    consecutiveDaysSkipped,
    neglectScore: 0,
    lastCompletedDate: lastCompletedDay?.date || null,
    twoWeekHistory,
  };

  stats.neglectScore = computeNeglectScore(stats, category);
  return stats;
}

export function getAllNeglectScores(state: AppState): Map<string, number> {
  const scores = new Map<string, number>();
  for (const cat of state.categories) {
    if (cat.enabled) {
      const stats = getCategoryStats(state, cat.id);
      scores.set(cat.id, stats.neglectScore);
    }
  }
  return scores;
}

export function shouldNudgeSonTime(state: AppState): boolean {
  const stats = getCategoryStats(state, 'son-time');
  return stats.consecutiveDaysSkipped >= 3;
}
