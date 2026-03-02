import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
  totalSeconds: number;
  onComplete: () => void;
  onWarning?: () => void;
  warningAtSeconds?: number;
  autoStart?: boolean;
}

export function useTimer({
  totalSeconds,
  onComplete,
  onWarning,
  warningAtSeconds = 300,
  autoStart = true,
}: UseTimerOptions) {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [hasWarned, setHasWarned] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const startTimeRef = useRef<number>(0);
  const elapsedAtPauseRef = useRef(0);

  const remaining = Math.max(0, totalSeconds - elapsed);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    elapsedAtPauseRef.current = elapsed;
    setIsRunning(true);
  }, [elapsed]);

  const pause = useCallback(() => {
    setIsRunning(false);
    elapsedAtPauseRef.current = elapsed;
  }, [elapsed]);

  const reset = useCallback((_newTotal?: number) => {
    setElapsed(0);
    setIsRunning(false);
    setHasWarned(false);
    elapsedAtPauseRef.current = 0;
  }, []);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      // Use wall clock time to handle backgrounding/drift
      const wallElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const newElapsed = elapsedAtPauseRef.current + wallElapsed;

      setElapsed(newElapsed);

      const newRemaining = totalSeconds - newElapsed;

      // Warning callback
      if (!hasWarned && onWarning && newRemaining <= warningAtSeconds && newRemaining > 0) {
        setHasWarned(true);
        onWarning();
      }

      // Complete
      if (newElapsed >= totalSeconds) {
        setIsRunning(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        onComplete();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, totalSeconds, onComplete, onWarning, warningAtSeconds, hasWarned]);

  // Handle visibility change (fix timer when app comes back to foreground)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isRunning) {
        const wallElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const newElapsed = elapsedAtPauseRef.current + wallElapsed;
        setElapsed(Math.min(newElapsed, totalSeconds));
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isRunning, totalSeconds]);

  return {
    elapsed,
    remaining,
    isRunning,
    progress: totalSeconds > 0 ? elapsed / totalSeconds : 0,
    start,
    pause,
    reset,
  };
}
