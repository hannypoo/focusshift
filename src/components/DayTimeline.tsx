import { useMemo } from 'react';
import type { ScheduleBlock, Task } from '../types/database';
import type { Category } from '../types';
import TimeBlockCard from './TimeBlockCard';

interface DayTimelineProps {
  blocks: ScheduleBlock[];
  categories: Category[];
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onAddNote: (id: string, note: string) => void;
  onOverrideTravel?: (id: string, minutes: number) => void;
  multitaskableTasks?: Task[];
}

export default function DayTimeline({
  blocks,
  categories,
  onComplete,
  onSkip,
  onAddNote,
  onOverrideTravel,
  multitaskableTasks,
}: DayTimelineProps) {
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  // Sort blocks by start time
  const sorted = useMemo(
    () => [...blocks].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)),
    [blocks]
  );

  // Group blocks by time period for visual section headers
  const sections = useMemo(() => {
    const groups: { label: string; blocks: ScheduleBlock[] }[] = [];
    let currentLabel = '';

    for (const block of sorted) {
      const min = timeToMinutes(block.start_time);
      let label: string;
      if (min < 720) label = 'Morning';       // before 12:00
      else if (min < 900) label = 'Afternoon'; // before 3:00
      else if (min < 1020) label = 'Late Afternoon'; // before 5:00
      else label = 'Evening';

      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, blocks: [] });
      }
      groups[groups.length - 1].blocks.push(block);
    }

    return groups;
  }, [sorted]);

  return (
    <div className="space-y-1 py-2">
      {sections.map((section) => (
        <div key={section.label}>
          <div className="sticky top-0 z-10 px-2 py-1.5 bg-[#0a0a1a]/90 backdrop-blur-sm">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
              {section.label}
            </span>
          </div>
          <div className="space-y-1.5 px-1">
            {section.blocks.map((block) => (
              <TimeBlockCard
                key={block.id}
                block={block}
                category={categoryMap.get(block.category_id || '')}
                onComplete={onComplete}
                onSkip={onSkip}
                onAddNote={onAddNote}
                onOverrideTravel={onOverrideTravel}
                multitaskableTasks={multitaskableTasks}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function timeToMinutes(time: string): number {
  const parts = time.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}
