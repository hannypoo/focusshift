import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { useScheduleBlocksRange } from '../hooks/useScheduleBlocks';
import { useNeglect } from '../hooks/useNeglect';
import { getWeekDates, formatDayName, formatDayNumber, isDateToday } from '../lib/dateUtils';
import { addDays } from '../lib/utils';
import { getCategoryColors } from '../lib/utils';
import type { ScheduleBlock } from '../types/database';

export default function WeekView() {
  const [weekOffset, setWeekOffset] = useState(0);
  const baseDate = addDays(new Date().toISOString().split('T')[0], weekOffset * 7);
  const weekDates = getWeekDates(baseDate);

  const { data: categories, isLoading: catsLoading } = useCategories();
  const { data: blocks, isLoading: blocksLoading } = useScheduleBlocksRange(weekDates[0], weekDates[6]);
  const neglect = useNeglect(categories, blocks);

  // Group blocks by date
  const blocksByDate = useMemo(() => {
    if (!blocks) return new Map<string, ScheduleBlock[]>();
    const map = new Map<string, ScheduleBlock[]>();
    for (const b of blocks) {
      const existing = map.get(b.date) || [];
      existing.push(b);
      map.set(b.date, existing);
    }
    return map;
  }, [blocks]);

  if (catsLoading || blocksLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold text-white">Week View</h1>
          <p className="text-xs text-white/40">
            {weekDates[0].split('-').slice(1).join('/')} — {weekDates[6].split('-').slice(1).join('/')}
          </p>
        </div>
        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 transition-colors"
          aria-label="Next week"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 7-column grid */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="grid grid-cols-7 gap-1 mb-4">
          {weekDates.map((date) => {
            const today = isDateToday(date);
            const dayBlocks = blocksByDate.get(date) || [];
            const completed = dayBlocks.filter((b) => b.status === 'completed' && !b.is_transition).length;
            const total = dayBlocks.filter((b) => !b.is_transition).length;

            return (
              <div
                key={date}
                className={`rounded-xl p-2 text-center ${
                  today ? 'bg-indigo-500/15 border border-indigo-500/30' : 'bg-white/3'
                }`}
              >
                <p className={`text-[10px] font-medium ${today ? 'text-indigo-400' : 'text-white/40'}`}>
                  {formatDayName(date)}
                </p>
                <p className={`text-lg font-bold ${today ? 'text-white' : 'text-white/70'}`}>
                  {formatDayNumber(date)}
                </p>

                {/* Stacked colored bars */}
                <div className="mt-2 space-y-0.5">
                  {dayBlocks
                    .filter((b) => !b.is_transition && !b.is_travel && !b.is_prep)
                    .slice(0, 8)
                    .map((b) => {
                      const cat = categories?.find((c) => c.id === b.category_id);
                      const colors = getCategoryColors(cat?.color || 'gray');
                      return (
                        <div
                          key={b.id}
                          className={`h-1.5 rounded-full ${
                            b.status === 'completed' ? colors.bg : colors.bgLight
                          }`}
                        />
                      );
                    })}
                </div>

                {total > 0 && (
                  <p className="text-[9px] text-white/30 mt-1">
                    {completed}/{total}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Neglect meters */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-white/60 px-2">Category Health</h2>
          {neglect.map((n) => {
            const colors = getCategoryColors(n.color);
            const barColor =
              n.score < 30 ? 'bg-emerald-500' :
              n.score < 60 ? 'bg-amber-500' :
              'bg-red-500';

            return (
              <div key={n.categoryId} className="bg-white/3 rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-medium ${colors.text}`}>{n.categoryName}</span>
                  <span className="text-[10px] text-white/30">
                    {n.weeklyMinutes}m / {n.weeklyTarget ?? '—'}m
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(n.score, 100)}%` }}
                  />
                </div>
                {n.consecutiveDaysSkipped >= 3 && (
                  <p className="text-[10px] text-red-400 mt-1">
                    {n.consecutiveDaysSkipped} days without — consider scheduling today
                  </p>
                )}
              </div>
            );
          })}
          {neglect.length === 0 && (
            <p className="text-xs text-white/25 px-2 py-4 text-center">
              Complete some blocks to start tracking category health.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
