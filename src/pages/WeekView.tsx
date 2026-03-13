import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, BookOpen, Star, Clock, Calendar } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { useScheduleBlocksRange } from '../hooks/useScheduleBlocks';
import { getWeekDates, formatDayName, formatDayNumber, isDateToday } from '../lib/dateUtils';
import { addDays, formatTimeOfDay } from '../lib/utils';
import { getCategoryColors } from '../lib/utils';
import { enrichBlocks } from '../lib/blockEnricher';
import type { ScheduleBlock } from '../types/database';

export default function WeekView() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const baseDate = addDays(new Date().toISOString().split('T')[0], weekOffset * 7);
  const weekDates = getWeekDates(baseDate);

  const { data: categories, isLoading: catsLoading } = useCategories();
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

      // Fixed appointments are always notable
      if (b.is_fixed) {
        highlights.push({ label: b.title, time: b.start_time, icon: 'fixed' });
        continue;
      }

      // Hard tasks
      if (b.difficulty === 'hard') {
        highlights.push({ label: b.title, time: b.start_time, icon: 'hard' });
        continue;
      }

      // Skip meals and routine blocks — they're not "notable"
      if (b.is_meal || b.is_self_care) continue;

      // Everything else — only show if there are few highlights so far
      if (highlights.length < 3) {
        highlights.push({ label: b.title, time: b.start_time, icon: 'normal' });
      }
    }

    return highlights.slice(0, 4);
  };

  if (catsLoading || blocksLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const selectedBlocks = selectedDate ? enrichBlocks(blocksByDate.get(selectedDate) || []) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <button
          onClick={() => { setWeekOffset((o) => o - 1); setSelectedDate(null); }}
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
          onClick={() => { setWeekOffset((o) => o + 1); setSelectedDate(null); }}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 transition-colors"
          aria-label="Next week"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-24">
        {/* Day cards */}
        <div className="space-y-2">
          {weekDates.map((date) => {
            const today = isDateToday(date);
            const selected = selectedDate === date;
            const dayBlocks = blocksByDate.get(date) || [];
            const realBlocks = dayBlocks.filter((b) => !b.is_transition && !b.is_travel && !b.is_prep);
            const completed = realBlocks.filter((b) => b.status === 'completed').length;
            const total = realBlocks.length;
            const highlights = getDayHighlights(dayBlocks);

            return (
              <button
                key={date}
                onClick={() => setSelectedDate(selected ? null : date)}
                className={`w-full text-left rounded-2xl p-3 transition-all ${
                  selected
                    ? 'bg-indigo-500/15 border border-indigo-500/30 ring-1 ring-indigo-500/20'
                    : today
                      ? 'bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/15'
                      : 'bg-white/3 border border-white/5 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Day badge */}
                  <div className={`w-12 text-center shrink-0 ${today ? 'text-indigo-400' : 'text-white/50'}`}>
                    <p className="text-[10px] font-medium uppercase">{formatDayName(date)}</p>
                    <p className="text-xl font-bold text-white">{formatDayNumber(date)}</p>
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

                  {/* Completion count */}
                  {total > 0 && (
                    <div className="text-right shrink-0">
                      <p className={`text-lg font-bold ${completed === total && total > 0 ? 'text-emerald-400' : 'text-white/40'}`}>
                        {completed}<span className="text-white/20">/{total}</span>
                      </p>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Expanded day detail */}
        {selectedDate && selectedBlocks && (
          <div className="mt-3 space-y-1.5 animate-fade-in-up">
            <h3 className="text-xs font-semibold text-white/40 px-1 uppercase tracking-wider">
              {formatDayName(selectedDate)} Schedule
            </h3>
            {selectedBlocks.length === 0 && (
              <p className="text-xs text-white/25 px-1 py-4 text-center italic">No blocks for this day</p>
            )}
            {selectedBlocks
              .filter((b) => !b.is_transition && !b.is_buffer)
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
              .map((block) => {
                const cat = categories?.find((c) => c.id === block.category_id);
                const colors = getCategoryColors(cat?.color || 'gray');
                return (
                  <div
                    key={block.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                      block.status === 'completed'
                        ? 'bg-white/3 border-white/5 opacity-50'
                        : block.is_fixed
                          ? 'bg-amber-500/5 border-amber-500/15'
                          : `${colors.bgLight} ${colors.border}/20`
                    }`}
                  >
                    <div className={`w-1.5 h-8 rounded-full ${block.is_fixed ? 'bg-amber-500' : colors.bg}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${block.status === 'completed' ? 'line-through text-white/40' : 'text-white'}`}>
                        {block.title}
                      </p>
                      <p className="text-[10px] text-white/30">
                        {formatTimeOfDay(block.start_time)} – {formatTimeOfDay(block.end_time)}
                        {block.difficulty && <span className="ml-1.5">· {block.difficulty}</span>}
                      </p>
                    </div>
                    {block.is_fixed && <MapPin size={12} className="text-amber-400/60 shrink-0" />}
                    {block.is_travel && <Clock size={12} className="text-blue-400/60 shrink-0" />}
                  </div>
                );
              })}
          </div>
        )}
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
    case 'self_care':
      return <BookOpen size={12} className="text-emerald-400 shrink-0" />;
    default:
      return <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />;
  }
}
