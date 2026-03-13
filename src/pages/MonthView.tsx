import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { useScheduleBlocksRange } from '../hooks/useScheduleBlocks';
import { useTasks } from '../hooks/useTasks';
import { useCategories } from '../hooks/useCategories';
import { getMonthDates, isDateToday } from '../lib/dateUtils';
import { getCategoryColors } from '../lib/utils';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MonthView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const cells = useMemo(() => getMonthDates(year, month), [year, month]);
  const firstDate = cells.find((c) => c !== null) || '';
  const lastDate = [...cells].reverse().find((c) => c !== null) || '';

  const { data: blocks, isLoading: blocksLoading } = useScheduleBlocksRange(firstDate, lastDate);
  const { data: tasks } = useTasks({ dueBefore: lastDate });
  const { data: categories, isLoading: catsLoading } = useCategories();

  // Blocks per day (just counts by category)
  const dayData = useMemo(() => {
    const map = new Map<string, { total: number; completed: number; categories: Set<string> }>();
    if (blocks) {
      for (const b of blocks) {
        if (b.is_transition || b.is_travel || b.is_prep) continue;
        const existing = map.get(b.date) || { total: 0, completed: 0, categories: new Set() };
        existing.total++;
        if (b.status === 'completed') existing.completed++;
        if (b.category_id) existing.categories.add(b.category_id);
        map.set(b.date, existing);
      }
    }
    return map;
  }, [blocks]);

  // Due dates
  const dueDates = useMemo(() => {
    const set = new Set<string>();
    if (tasks) {
      for (const t of tasks) {
        if (t.due_date && t.status !== 'completed') set.add(t.due_date);
      }
    }
    return set;
  }, [tasks]);

  if (blocksLoading || catsLoading) {
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
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h1>
        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day of week labels */}
      <div className="grid grid-cols-7 gap-1 px-3 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[10px] text-white/30 font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, i) => {
            if (!date) {
              return <div key={`empty-${i}`} className="aspect-square" />;
            }

            const today = isDateToday(date);
            const data = dayData.get(date);
            const hasDue = dueDates.has(date);
            const dayNum = parseInt(date.split('-')[2]);

            // Get top 3 category colors for dots
            const catColors = data
              ? [...data.categories]
                  .slice(0, 3)
                  .map((catId) => {
                    const cat = categories?.find((c) => c.id === catId);
                    return getCategoryColors(cat?.color || 'gray').bg;
                  })
              : [];

            return (
              <div
                key={date}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center relative ${
                  today
                    ? 'bg-indigo-500/20 border border-indigo-500/40'
                    : data
                    ? 'bg-white/3'
                    : ''
                }`}
              >
                <span className={`text-sm ${today ? 'text-indigo-400 font-bold' : 'text-white/60'}`}>
                  {dayNum}
                </span>

                {/* Category dots */}
                {catColors.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {catColors.map((bg, j) => (
                      <div key={j} className={`w-1.5 h-1.5 rounded-full ${bg}`} />
                    ))}
                  </div>
                )}

                {/* Due date badge */}
                {hasDue && (
                  <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
