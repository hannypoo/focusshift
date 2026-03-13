interface DayProgressProps {
  completed: number;
  total: number;
  percent: number;
}

export default function DayProgress({ completed, total, percent }: DayProgressProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      {/* Battery-style progress bar (fills up) */}
      <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-500 min-w-[2px] ${percent === 100 ? 'shadow-[0_0_8px_rgba(99,102,241,0.5)]' : ''}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs font-medium text-white/40 tabular-nums whitespace-nowrap">
        {completed}/{total}
      </span>
    </div>
  );
}
