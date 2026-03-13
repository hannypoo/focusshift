import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin, Star, Calendar } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { useScheduleBlocksRange } from '../hooks/useScheduleBlocks';
import { getWeekDates, formatDayName, formatDayNumber, isDateToday } from '../lib/dateUtils';
import { addDays, formatTimeOfDay } from '../lib/utils';
import { enrichBlocks } from '../lib/blockEnricher';
import type { ScheduleBlock } from '../types/database';

export default function WeekView() {
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  const baseDate = addDays(new Date().toISOString().split('T')[0], weekOffset * 7);
  const weekDates = getWeekDates(baseDate);

  const { isLoading: catsLoading } = useCategories();
  const { data: blocks, isLoading: blocksLoading } = useScheduleBlocksRange(weekDates[0], weekDates[6]);

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

  // Get "highlights" for a day — the notable things
  const getDayHighlights = (dayBlocks: ScheduleBlock[]) => {
    const enriched = enrichBlocks(dayBlocks);
    const highlights: { label: string; time: string; icon: 'fixed' | 'hard' | 'errand' | 'self_care' | 'normal' }[] = [];

    for (const b of enriched) {
      if (b.is_transition || b.is_travel || b.is_prep || b.is_buffer) continue;

      if (b.is_fixed) {
        highlights.push({ label: b.title, time: b.start_time, icon: 'fixed' });
        continue;
      }

      if (b.difficulty === 'hard') {
        highlights.push({ label: b.title, time: b.start_time, icon: 'hard' });
        continue;
      }

      if (b.is_meal || b.is_self_care) continue;

      if (highlights.length < 3) {
        highlights.push({ label: b.title, time: b.start_time, icon: 'normal' });
      }
    }

    return highlights.slice(0, 3);
  };

  if (catsLoading || blocksLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const handleDayClick = (date: string) => {
    if (isDateToday(date)) {
      navigate('/');
    } else {
      navigate(`/day/${date}`);
    }
  };

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

      <div className="flex-1 overflow-y-auto px-3 pb-24">
        <div className="space-y-2">
          {weekDates.map((date) => {
            const today = isDateToday(date);
            const dayBlocks = blocksByDate.get(date) || [];
            const realBlocks = dayBlocks.filter((b) => !b.is_transition && !b.is_travel && !b.is_prep);
            const completed = realBlocks.filter((b) => b.status === 'completed').length;
            const total = realBlocks.length;
            const highlights = getDayHighlights(dayBlocks);

            return (
              <button
                key={date}
                onClick={() => handleDayClick(date)}
                className={`w-full text-left rounded-2xl p-3.5 transition-all group ${
                  today
                    ? 'bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/15'
                    : 'bg-white/3 border border-white/5 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Day badge */}
                  <div className={`w-12 text-center shrink-0 ${today ? 'text-indigo-400' : 'text-white/50'}`}>
                    <p className="text-[10px] font-medium uppercase">{formatDayName(date)}</p>
                    <p className={`text-xl font-bold ${today ? 'text-indigo-300' : 'text-white'}`}>{formatDayNumber(date)}</p>
                  </div>

                  {/* Highlights */}
                  <div className="flex-1 min-w-0">
                    {highlights.length > 0 ? (
                      <div className="space-y-1">
                        {highlights.map((h, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <HighlightIcon type={h.icon} />
                            <span className="text-xs text-white/70 truncate">{h.label}</span>
                            <span className="text-[10px] text-white/30 shrink-0">{formatTimeOfDay(h.time)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-white/25 italic">Nothing scheduled</p>
                    )}
                  </div>

                  {/* Right side: count + chevron */}
                  <div className="flex items-center gap-2 shrink-0">
                    {total > 0 && (
                      <p className={`text-sm font-bold ${completed === total && total > 0 ? 'text-emerald-400' : 'text-white/30'}`}>
                        {completed}/{total}
                      </p>
                    )}
                    <ChevronRight size={16} className="text-white/15 group-hover:text-white/40 transition-colors" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HighlightIcon({ type }: { type: string }) {
  switch (type) {
    case 'fixed':
      return <MapPin size={12} className="text-amber-400 shrink-0" />;
    case 'hard':
      return <Star size={12} className="text-red-400 shrink-0" />;
    case 'errand':
      return <Calendar size={12} className="text-teal-400 shrink-0" />;
    default:
      return <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />;
  }
}
