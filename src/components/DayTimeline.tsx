import { useMemo } from 'react';
import type { ScheduleBlock, Task } from '../types/database';
import type { Category } from '../types';
import { minutesToTime, formatTimeOfDay } from '../lib/utils';
import TimeBlockCard from './TimeBlockCard';
import CurrentTimeIndicator from './CurrentTimeIndicator';

interface DayTimelineProps {
  blocks: ScheduleBlock[];
  categories: Category[];
  wakeTime: string;      // HH:MM
  windDownTime: string;  // HH:MM
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onAddNote: (id: string, note: string) => void;
  onOverrideTravel?: (id: string, minutes: number) => void;
  multitaskableTasks?: Task[];
}

const PIXELS_PER_MINUTE = 1.5;

export default function DayTimeline({
  blocks,
  categories,
  wakeTime,
  windDownTime,
  onComplete,
  onSkip,
  onAddNote,
  onOverrideTravel,
  multitaskableTasks,
}: DayTimelineProps) {
  const wakeMin = timeToMinutes(wakeTime);
  const windDownMin = timeToMinutes(windDownTime);
  const totalMinutes = windDownMin - wakeMin;
  const totalHeight = totalMinutes * PIXELS_PER_MINUTE;

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  // Hour marks
  const hours = useMemo(() => {
    const marks: { label: string; top: number }[] = [];
    const startHour = Math.ceil(wakeMin / 60);
    const endHour = Math.floor(windDownMin / 60);
    for (let h = startHour; h <= endHour; h++) {
      const min = h * 60;
      marks.push({
        label: formatTimeOfDay(minutesToTime(min)),
        top: (min - wakeMin) * PIXELS_PER_MINUTE,
      });
    }
    return marks;
  }, [wakeMin, windDownMin]);

  return (
    <div className="relative" style={{ height: `${totalHeight}px` }}>
      {/* Hour marks */}
      {hours.map((h) => (
        <div
          key={h.label}
          className="absolute left-0 right-0 flex items-center"
          style={{ top: `${h.top}px` }}
        >
          <span className="w-10 text-[10px] text-white/20 text-right pr-2 tabular-nums">
            {h.label}
          </span>
          <div className="flex-1 h-px bg-white/5" />
        </div>
      ))}

      {/* Current time indicator */}
      <CurrentTimeIndicator
        wakeMinutes={wakeMin}
        windDownMinutes={windDownMin}
        pixelsPerMinute={PIXELS_PER_MINUTE}
      />

      {/* Blocks */}
      {blocks.map((block) => (
        <TimeBlockCard
          key={block.id}
          block={block}
          category={categoryMap.get(block.category_id || '')}
          pixelsPerMinute={PIXELS_PER_MINUTE}
          wakeMinutes={wakeMin}
          onComplete={onComplete}
          onSkip={onSkip}
          onAddNote={onAddNote}
          onOverrideTravel={onOverrideTravel}
          multitaskableTasks={multitaskableTasks}
        />
      ))}
    </div>
  );
}

function timeToMinutes(time: string): number {
  const parts = time.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}
