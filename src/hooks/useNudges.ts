import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useProfileId } from './useProfileId';
import { useProfile } from './useProfile';
import { useScheduleBlocks } from './useScheduleBlocks';
import { useDailyCheckin } from './useCheckins';
import { getToday, minutesToTime } from '../lib/utils';

export interface Nudge {
  type: 'momentum' | 'transition' | 'energy' | 'break' | 'encouragement' | 'reminder';
  message: string;
  trigger_time: string;
  priority: 'low' | 'medium' | 'high';
}

export function useNudges() {
  const profileId = useProfileId();
  const { data: profile } = useProfile();
  const { data: blocks } = useScheduleBlocks(getToday());
  const { data: checkin } = useDailyCheckin(getToday());
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNudges = useCallback(async () => {
    if (!profileId || !blocks) return;
    setIsLoading(true);

    try {
      const now = new Date();
      const currentTime = minutesToTime(now.getHours() * 60 + now.getMinutes());
      const completedCount = blocks.filter((b) => b.status === 'completed').length;

      const scheduleContext = blocks
        .filter((b) => b.status !== 'rescheduled' && b.status !== 'skipped')
        .map((b) => ({
          title: b.title,
          time: `${b.start_time}-${b.end_time}`,
          status: b.status,
          duration: b.duration_minutes,
        }));

      const { data, error } = await supabase.functions.invoke('generate-nudges', {
        body: {
          blocks: scheduleContext,
          current_time: currentTime,
          energy_level: checkin?.energy_level || 'medium',
          completed_count: completedCount,
          streak: profile?.streak || 0,
          productivity_zones: profile?.productivity_zones || [],
          treats: profile?.treats || [],
        },
      });

      if (error) throw error;
      setNudges((data as { nudges: Nudge[] }).nudges || []);
    } catch (err) {
      console.error('Nudges fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [profileId, blocks, checkin, profile]);

  // Get the next upcoming nudge based on current time
  const getNextNudge = useCallback((): Nudge | null => {
    if (!nudges.length) return null;
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();

    const upcoming = nudges.filter((n) => {
      const [h, m] = n.trigger_time.split(':').map(Number);
      return h * 60 + m >= currentMin;
    });

    return upcoming[0] || null;
  }, [nudges]);

  return { nudges, isLoading, fetchNudges, getNextNudge };
}
