import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useProfileId } from './useProfileId';

export interface CoachingInsight {
  type: 'strength' | 'pattern' | 'suggestion' | 'celebration';
  title: string;
  detail: string;
  icon: string;
}

export interface CoachingData {
  summary: string;
  insights: CoachingInsight[];
  top_tip: string;
  productivity_score: number | null;
}

export function useCoaching() {
  const profileId = useProfileId();
  const [data, setData] = useState<CoachingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCoaching = useCallback(async (days: number = 7) => {
    if (!profileId) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('schedule-coaching', {
        body: { profile_id: profileId, days },
      });

      if (fnError) throw fnError;
      setData(result as CoachingData);
    } catch (err) {
      console.error('Coaching fetch error:', err);
      setError('Could not load coaching insights');
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  return { data, isLoading, error, fetchCoaching };
}
