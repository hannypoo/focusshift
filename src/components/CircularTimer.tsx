interface CircularTimerProps {
  totalSeconds: number;
  elapsedSeconds: number;
  categoryColor: string;
  isPaused?: boolean;
  onTick?: () => void;
}

export default function CircularTimer({
  totalSeconds,
  elapsedSeconds,
  categoryColor,
  isPaused = false,
}: CircularTimerProps) {
  const remaining = Math.max(0, totalSeconds - elapsedSeconds);
  const progress = totalSeconds > 0 ? elapsedSeconds / totalSeconds : 0;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  // SVG circle params
  const size = 220;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  // Color for the ring based on time remaining
  const getStrokeColor = () => {
    if (remaining <= 60) return '#ef4444'; // red last minute
    if (remaining <= 300) return '#f59e0b'; // amber last 5 min
    // Use category color
    const colorMap: Record<string, string> = {
      rose: '#f43f5e', blue: '#3b82f6', purple: '#a855f7',
      teal: '#14b8a6', orange: '#f97316', amber: '#f59e0b',
      cyan: '#06b6d4', violet: '#8b5cf6', emerald: '#10b981', gray: '#6b7280',
    };
    return colorMap[categoryColor] || '#6366f1';
  };

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="timer-ring">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="timer-ring-track"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="timer-ring-progress"
          style={{ opacity: isPaused ? 0.5 : 1 }}
        />
      </svg>

      {/* Time display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-5xl font-bold tabular-nums tracking-tight ${isPaused ? 'animate-pulse-soft' : ''}`}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
        <span className="text-white/40 text-sm mt-1">
          {isPaused ? 'paused' : 'remaining'}
        </span>
      </div>
    </div>
  );
}
