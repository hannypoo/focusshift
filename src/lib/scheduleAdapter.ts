/**
 * Schedule Adapter — Builds SchedulerInput from hook data and calls the v2 scheduler.
 */
import type { Category } from '../types';
import type {
  Profile,
  ScheduleBlock,
  EnergyLevel,
  Task,
  RecurringTask,
  TravelTime,
  Location,
} from '../types/database';
import { generateDaySchedule, reshuffleRemainingBlocks } from './scheduler';

/**
 * Build SchedulerInput from hook data and generate schedule blocks.
 *
 * Callers pass whatever they have; missing arrays default to [].
 */
export function buildAndGenerateSchedule(opts: {
  profileId: string;
  profile: Profile;
  categories: Category[];
  energyLevel: EnergyLevel;
  date: string;
  tasks?: Task[];
  recurringTasks?: RecurringTask[];
  travelTimes?: TravelTime[];
  locations?: Location[];
  neglectScores?: Map<string, number>;
}): Omit<ScheduleBlock, 'id' | 'created_at' | 'updated_at'>[] {
  return generateDaySchedule({
    profileId: opts.profileId,
    profile: opts.profile,
    categories: opts.categories,
    tasks: opts.tasks ?? [],
    recurringTasks: opts.recurringTasks ?? [],
    travelTimes: opts.travelTimes ?? [],
    locations: opts.locations ?? [],
    energyLevel: opts.energyLevel,
    date: opts.date,
    neglectScores: opts.neglectScores,
  });
}

/**
 * Reshuffle only the remaining (unfinished) portion of the day with a new energy level.
 * Keeps completed/skipped/active/anchored blocks intact.
 */
export function buildAndReshuffleSchedule(opts: {
  profileId: string;
  profile: Profile;
  categories: Category[];
  energyLevel: EnergyLevel;
  date: string;
  tasks?: Task[];
  recurringTasks?: RecurringTask[];
  travelTimes?: TravelTime[];
  locations?: Location[];
  neglectScores?: Map<string, number>;
  existingBlocks: ScheduleBlock[];
}): Omit<ScheduleBlock, 'id' | 'created_at' | 'updated_at'>[] {
  return reshuffleRemainingBlocks({
    profileId: opts.profileId,
    profile: opts.profile,
    categories: opts.categories,
    tasks: opts.tasks ?? [],
    recurringTasks: opts.recurringTasks ?? [],
    travelTimes: opts.travelTimes ?? [],
    locations: opts.locations ?? [],
    energyLevel: opts.energyLevel,
    date: opts.date,
    neglectScores: opts.neglectScores,
    existingBlocks: opts.existingBlocks,
  });
}
