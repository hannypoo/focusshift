import type { TravelTime } from '../types/database';

/**
 * Get travel time between two locations, with ADHD buffer.
 * Uses running average from travel_times table.
 */
export function getTravelMinutes(
  travelTimes: TravelTime[],
  fromId: string,
  toId: string,
  adhdBufferMinutes: number = 10
): number {
  const record = travelTimes.find(
    (t) => t.from_location_id === fromId && t.to_location_id === toId
  );

  if (!record) return adhdBufferMinutes; // Unknown route, just use buffer

  const avgMinutes = record.entry_count > 0
    ? Math.round(record.total_minutes / record.entry_count)
    : record.duration_minutes;

  return avgMinutes + adhdBufferMinutes;
}

/**
 * Calculate prep + travel time for an appointment block.
 */
export function getPreBlockMinutes(
  travelTimes: TravelTime[],
  fromLocationId: string | null,
  toLocationId: string | null,
  prepMinutes: number = 0,
  adhdBufferMinutes: number = 10
): { travelMinutes: number; prepMinutes: number; totalMinutes: number } {
  let travelMinutes = 0;

  if (fromLocationId && toLocationId && fromLocationId !== toLocationId) {
    travelMinutes = getTravelMinutes(travelTimes, fromLocationId, toLocationId, adhdBufferMinutes);
  }

  return {
    travelMinutes,
    prepMinutes,
    totalMinutes: travelMinutes + prepMinutes,
  };
}

/**
 * Update running average for a travel route.
 */
export function calculateNewAverage(
  existing: TravelTime | undefined,
  actualMinutes: number
): { duration_minutes: number; entry_count: number; total_minutes: number } {
  if (!existing) {
    return {
      duration_minutes: actualMinutes,
      entry_count: 1,
      total_minutes: actualMinutes,
    };
  }

  const newCount = existing.entry_count + 1;
  const newTotal = existing.total_minutes + actualMinutes;

  return {
    duration_minutes: Math.round(newTotal / newCount),
    entry_count: newCount,
    total_minutes: newTotal,
  };
}
