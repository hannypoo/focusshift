import { useCallback } from 'react';
import { useProfile } from './useProfile';
import { useRewards, useCreateReward } from './useRewards';
import { getToday } from '../lib/utils';
import type { TaskDifficulty } from '../types/database';

const TREAT_LABELS: Record<string, string> = {
  coffee: 'Grab a coffee or tea',
  snack: 'Enjoy a snack break',
  phone: 'Take a quick phone break',
  walk: 'Go for a short walk',
  music: 'Play your favorite song',
  game: 'Play a quick game',
  stretch: 'Do a good stretch',
};

export function useRewardEngine() {
  const today = getToday();
  const { data: profile } = useProfile();
  const { data: todayRewards } = useRewards(today);
  const createReward = useCreateReward();

  const streak = profile?.streak ?? 0;
  const treats = profile?.treats ?? [];

  const getRandomTreat = useCallback((): string | null => {
    if (treats.length === 0) return null;
    const treat = treats[Math.floor(Math.random() * treats.length)];
    return TREAT_LABELS[treat] || treat;
  }, [treats]);

  const getRewardIntensity = useCallback((difficulty?: TaskDifficulty | null): 'low' | 'medium' | 'high' => {
    if (difficulty === 'hard') return 'high';
    if (difficulty === 'easy') return 'low';
    return 'medium';
  }, []);

  const earnReward = useCallback(async (opts: {
    label: string;
    type?: string;
    difficulty?: TaskDifficulty | null;
  }) => {
    const intensity = getRewardIntensity(opts.difficulty);
    const treatSuggestion = intensity !== 'low' ? getRandomTreat() : null;

    await createReward.mutateAsync({
      type: opts.type || 'completion',
      label: opts.label,
      treat_suggestion: treatSuggestion || undefined,
      date: today,
    });

    return { intensity, treatSuggestion };
  }, [today, getRewardIntensity, getRandomTreat, createReward]);

  const todayStats = {
    rewardsEarned: todayRewards?.length ?? 0,
    streak,
  };

  return {
    earnReward,
    getRandomTreat,
    getRewardIntensity,
    todayStats,
  };
}
