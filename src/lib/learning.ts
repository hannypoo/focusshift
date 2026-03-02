import type { TaskHistory, ScheduleBlock } from '../types/database';

/**
 * Percentile-based duration estimation from task history.
 * Uses the 70th percentile (accounts for ADHD variance without anchoring to worst case).
 */
export function estimateDuration(
  history: TaskHistory[],
  options?: {
    categoryId?: string;
    taskType?: string;
    homeworkType?: string;
    fallbackMinutes?: number;
  }
): number {
  const fallback = options?.fallbackMinutes ?? 30;

  // Filter relevant history entries
  let entries = history.filter((h) => h.actual_minutes != null && h.actual_minutes > 0);

  if (options?.categoryId) {
    entries = entries.filter((h) => h.category_id === options.categoryId);
  }
  if (options?.taskType) {
    entries = entries.filter((h) => h.task_type === options.taskType);
  }
  if (options?.homeworkType) {
    entries = entries.filter((h) => h.homework_type === options.homeworkType);
  }

  // Need at least 3 data points for a meaningful estimate
  if (entries.length < 3) return fallback;

  const durations = entries
    .map((h) => h.actual_minutes!)
    .sort((a, b) => a - b);

  // 70th percentile
  const idx = Math.floor(durations.length * 0.7);
  return durations[Math.min(idx, durations.length - 1)];
}

/**
 * Get accuracy stats: how close estimates have been to actuals.
 */
export function getEstimateAccuracy(history: TaskHistory[]): {
  avgOvershoot: number;
  avgUndershoot: number;
  accuratePercent: number;
  totalEntries: number;
} {
  const withBoth = history.filter(
    (h) => h.estimated_minutes != null && h.actual_minutes != null
  );

  if (withBoth.length === 0) {
    return { avgOvershoot: 0, avgUndershoot: 0, accuratePercent: 0, totalEntries: 0 };
  }

  let overTotal = 0;
  let overCount = 0;
  let underTotal = 0;
  let underCount = 0;
  let accurate = 0;

  for (const h of withBoth) {
    const diff = h.actual_minutes! - h.estimated_minutes!;
    const ratio = Math.abs(diff) / h.estimated_minutes!;

    if (ratio <= 0.15) {
      accurate++;
    } else if (diff > 0) {
      underTotal += diff;
      underCount++;
    } else {
      overTotal += Math.abs(diff);
      overCount++;
    }
  }

  return {
    avgOvershoot: overCount > 0 ? Math.round(overTotal / overCount) : 0,
    avgUndershoot: underCount > 0 ? Math.round(underTotal / underCount) : 0,
    accuratePercent: Math.round((accurate / withBoth.length) * 100),
    totalEntries: withBoth.length,
  };
}

/**
 * Analyze completion patterns from task history and schedule blocks.
 * Returns insights the scheduler and AI chat can use.
 */
export function analyzeCompletionPatterns(
  history: TaskHistory[],
  recentBlocks: ScheduleBlock[]
): CompletionInsights {
  // Best productive hours (when tasks are most often completed)
  const hourCounts = new Map<number, number>();
  for (const h of history) {
    if (h.time_of_day) {
      const hour = parseInt(h.time_of_day.split(':')[0], 10);
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }
  }
  const bestHours = [...hourCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => hour);

  // Common skip reasons by category
  const skipsByCategory = new Map<string, number>();
  for (const block of recentBlocks) {
    if (block.status === 'skipped' && block.category_id) {
      skipsByCategory.set(block.category_id, (skipsByCategory.get(block.category_id) || 0) + 1);
    }
  }
  const commonlySkippedCategories = [...skipsByCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([catId, count]) => ({ categoryId: catId, skipCount: count }));

  // Average overrun (actual vs estimated)
  const overruns = history.filter(
    (h) => h.actual_minutes != null && h.estimated_minutes != null && h.actual_minutes > h.estimated_minutes
  );
  const avgOverrunMinutes = overruns.length > 0
    ? Math.round(overruns.reduce((sum, h) => sum + (h.actual_minutes! - h.estimated_minutes!), 0) / overruns.length)
    : 0;

  // Difficulty calibration: how often each difficulty level is completed
  const difficultyStats = { easy: { completed: 0, total: 0 }, medium: { completed: 0, total: 0 }, hard: { completed: 0, total: 0 } };
  for (const block of recentBlocks) {
    if (block.difficulty && block.difficulty in difficultyStats) {
      const key = block.difficulty as keyof typeof difficultyStats;
      difficultyStats[key].total++;
      if (block.status === 'completed') difficultyStats[key].completed++;
    }
  }

  // Completion rate by day of week (0=Sun, 6=Sat)
  const dayStats = Array.from({ length: 7 }, () => ({ completed: 0, total: 0 }));
  for (const h of history) {
    if (h.day_of_week != null) {
      dayStats[h.day_of_week].total++;
      dayStats[h.day_of_week].completed++;
    }
  }

  return {
    bestProductiveHours: bestHours,
    commonlySkippedCategories,
    avgOverrunMinutes,
    difficultyCompletionRates: {
      easy: difficultyStats.easy.total > 0 ? Math.round((difficultyStats.easy.completed / difficultyStats.easy.total) * 100) : 100,
      medium: difficultyStats.medium.total > 0 ? Math.round((difficultyStats.medium.completed / difficultyStats.medium.total) * 100) : 100,
      hard: difficultyStats.hard.total > 0 ? Math.round((difficultyStats.hard.completed / difficultyStats.hard.total) * 100) : 100,
    },
    totalTasksCompleted: history.length,
    estimateAccuracy: getEstimateAccuracy(history),
  };
}

export interface CompletionInsights {
  bestProductiveHours: number[];
  commonlySkippedCategories: { categoryId: string; skipCount: number }[];
  avgOverrunMinutes: number;
  difficultyCompletionRates: { easy: number; medium: number; hard: number };
  totalTasksCompleted: number;
  estimateAccuracy: ReturnType<typeof getEstimateAccuracy>;
}
