/**
 * FocusShift v2 Scheduler — 5-stage ADHD-centric pipeline
 *
 * Pipeline: ANCHOR → TRAVEL → BUFFER → FILL → OVERLAP RESOLUTION
 */
import type { Category, EnergyLevel } from '../types';
import type {
  Profile,
  Task,
  RecurringTask,
  TravelTime,
  Location,
  ScheduleBlock,
  ProductivityZone,
  TaskDifficulty,
} from '../types/database';
import { generateId, parseTimeToMinutes, minutesToTime } from './utils';
import { getTravelMinutes } from './travel';
// profileId passed via SchedulerInput

// ─── Public API ──────────────────────────────────────────────────

export interface SchedulerInput {
  profileId: string;
  profile: Profile;
  categories: Category[];
  tasks: Task[];
  recurringTasks: RecurringTask[];
  travelTimes: TravelTime[];
  locations: Location[];
  energyLevel: EnergyLevel;
  date: string;
  neglectScores?: Map<string, number>;
}

export function generateDaySchedule(input: SchedulerInput): Omit<ScheduleBlock, 'id' | 'created_at' | 'updated_at'>[] {
  const {
    profileId, profile, categories, tasks, recurringTasks, travelTimes,
    locations, energyLevel, date, neglectScores,
  } = input;

  const wakeMin = parseTimeToMinutes(profile.default_wake_time.substring(0, 5));
  const windDownMin = parseTimeToMinutes(profile.default_wind_down_time.substring(0, 5));
  const dow = new Date(date + 'T00:00:00').getDay();

  const blocks: InternalBlock[] = [];

  // ─── PHASE 1: ANCHOR ───────────────────────────────────────────
  // Place immovable blocks: wake buffer, wind-down buffer, fixed events, meals, self-care

  // Wake-up buffer
  const wakeBufferEnd = wakeMin + profile.wake_buffer_minutes;
  if (profile.wake_buffer_minutes > 0) {
    blocks.push(makeBlock({
      title: 'Morning Buffer',
      startMin: wakeMin,
      endMin: wakeBufferEnd,
      blockType: 'buffer',
      isBuffer: true,
      isProtected: true,
      priority: 100,
      aiReason: 'Gentle wake-up time',
    }));
  }

  // Wind-down buffer
  const windDownBufferStart = windDownMin - profile.wind_down_buffer_minutes;
  if (profile.wind_down_buffer_minutes > 0) {
    blocks.push(makeBlock({
      title: 'Wind Down',
      startMin: windDownBufferStart,
      endMin: windDownMin,
      blockType: 'buffer',
      isBuffer: true,
      isProtected: true,
      priority: 100,
      aiReason: 'Time to relax and prepare for bed',
    }));
  }

  // Fixed recurring events for today's day of week
  const todayRecurring = recurringTasks.filter((r) =>
    r.enabled && r.start_time && r.end_time && r.days_of_week?.includes(dow)
  );

  for (const event of todayRecurring) {
    const startMin = parseTimeToMinutes(event.start_time!.substring(0, 5));
    const endMin = parseTimeToMinutes(event.end_time!.substring(0, 5));
    const cat = categories.find((c) => c.id === event.category_id);
    blocks.push(makeBlock({
      title: event.title,
      startMin,
      endMin,
      categoryId: event.category_id,
      blockType: 'fixed_event',
      isFixed: true,
      isProtected: cat?.isProtected ?? false,
      locationId: event.location_id,
      priority: 90,
    }));
  }

  // Meals
  const meals = profile.meal_times;
  if (meals.breakfast.enabled) {
    const t = parseTimeToMinutes(meals.breakfast.time);
    blocks.push(makeBlock({
      title: 'Breakfast',
      startMin: t,
      endMin: t + 30,
      blockType: 'meal',
      isMeal: true,
      isProtected: true,
      priority: 95,
      aiReason: 'Fuel up for the day',
    }));
  }
  if (meals.lunch.enabled) {
    const t = parseTimeToMinutes(meals.lunch.time);
    blocks.push(makeBlock({
      title: 'Lunch',
      startMin: t,
      endMin: t + 30,
      blockType: 'meal',
      isMeal: true,
      isProtected: true,
      priority: 95,
      aiReason: 'Midday refuel',
    }));
  }
  if (meals.dinner.enabled) {
    const t = parseTimeToMinutes(meals.dinner.time);
    blocks.push(makeBlock({
      title: 'Dinner',
      startMin: t,
      endMin: t + 30,
      blockType: 'meal',
      isMeal: true,
      isProtected: true,
      priority: 95,
      aiReason: 'Evening meal',
    }));
  }

  // Morning self-care (after wake buffer)
  if (profile.self_care_auto) {
    const scStart = wakeBufferEnd;
    blocks.push(makeBlock({
      title: 'Morning Routine',
      startMin: scStart,
      endMin: scStart + 10,
      blockType: 'self_care',
      isSelfCare: true,
      isProtected: true,
      priority: 92,
      aiReason: 'Brush teeth, wash face, get ready',
    }));

    // Evening self-care (before wind-down)
    const evStart = windDownBufferStart - 10;
    blocks.push(makeBlock({
      title: 'Evening Routine',
      startMin: evStart,
      endMin: evStart + 10,
      blockType: 'self_care',
      isSelfCare: true,
      isProtected: true,
      priority: 92,
      aiReason: 'Brush teeth, wind-down prep',
    }));
  }

  // Chore block at configured time
  if (profile.chore_block_minutes > 0 && profile.chore_block_time) {
    const choreStart = parseTimeToMinutes(profile.chore_block_time.substring(0, 5));
    blocks.push(makeBlock({
      title: 'Chore Block',
      startMin: choreStart,
      endMin: choreStart + profile.chore_block_minutes,
      blockType: 'chore_block',
      isChoreBlock: true,
      priority: 50,
      aiReason: 'Tackle small household tasks',
    }));
  }

  // ─── PHASE 2: TRAVEL ──────────────────────────────────────────
  // Insert travel blocks before anchored blocks that have a location

  const homeLocation = locations.find((l) => l.is_home);
  const sortedAnchored = [...blocks].sort((a, b) => a.startMin - b.startMin);
  let prevLocationId = homeLocation?.id ?? null;

  for (const block of sortedAnchored) {
    if (block.locationId && block.locationId !== prevLocationId && prevLocationId) {
      const travelMin = getTravelMinutes(travelTimes, prevLocationId, block.locationId, profile.adhd_buffer_minutes);
      if (travelMin > 0) {
        blocks.push(makeBlock({
          title: `Travel to ${block.title}`,
          startMin: block.startMin - travelMin,
          endMin: block.startMin,
          blockType: 'travel',
          isTravel: true,
          priority: 85,
          aiReason: `${travelMin} min travel + ADHD buffer`,
        }));
      }
      prevLocationId = block.locationId;
    } else if (block.locationId) {
      prevLocationId = block.locationId;
    }
  }

  // ─── PHASE 3: BUFFER ──────────────────────────────────────────
  // Insert 5-min breathing buffers between non-buffer blocks, then resolve overlaps

  blocks.sort((a, b) => a.startMin - b.startMin);

  const buffers: InternalBlock[] = [];
  for (let i = 0; i < blocks.length - 1; i++) {
    const curr = blocks[i];
    const next = blocks[i + 1];
    // Don't add buffer between adjacent buffers/transitions or if already tight
    if (curr.isBuffer || next.isBuffer || curr.isTransition || next.isTransition) continue;
    const gap = next.startMin - curr.endMin;
    if (gap >= 5) {
      // There's room for a 5-min buffer
      buffers.push(makeBlock({
        title: 'Breather',
        startMin: curr.endMin,
        endMin: curr.endMin + 5,
        blockType: 'buffer',
        isBuffer: true,
        isTransition: true,
        priority: 10,
      }));
    } else if (gap > 0 && gap < 5) {
      // Tiny gap — use it as micro-buffer
      buffers.push(makeBlock({
        title: 'Breather',
        startMin: curr.endMin,
        endMin: curr.endMin + gap,
        blockType: 'buffer',
        isBuffer: true,
        isTransition: true,
        priority: 10,
      }));
    }
  }
  blocks.push(...buffers);

  // ─── PHASE 4: FILL ────────────────────────────────────────────
  // Fill remaining free slots with tasks, respecting productivity zones

  blocks.sort((a, b) => a.startMin - b.startMin);
  const freeSlots = findFreeSlots(wakeMin, windDownMin, blocks);
  const zones = profile.productivity_zones || [];

  // Pending tasks to schedule
  const pendingTasks = tasks.filter((t) =>
    t.status === 'pending' && (!t.scheduled_date || t.scheduled_date === date)
  );

  // Rank tasks for scheduling
  const rankedTasks = rankTasks(pendingTasks, categories, neglectScores || new Map(), energyLevel);

  // Rank categories (for category-based fallback when no specific tasks)
  const rankedCategories = categories
    .filter((c) => c.enabled && !c.isFixed)
    .map((c) => {
      const neglect = neglectScores?.get(c.id) || 0;
      return { category: c, effectivePriority: c.priority + (neglect / 100) * 5, neglect };
    })
    .sort((a, b) => b.effectivePriority - a.effectivePriority);

  const taskUsed = new Set<string>();
  const categoryBlockCount = new Map<string, number>();

  for (const slot of freeSlots) {
    let cursor = slot.startMin;

    while (cursor < slot.endMin) {
      const zone = getZoneAt(cursor, zones);
      const remaining = slot.endMin - cursor;
      if (remaining < 10) break; // Not enough time for any block

      // Dead zone → relaxation only
      if (zone === 'dead') {
        const relaxDuration = Math.min(remaining, 30);
        blocks.push(makeBlock({
          title: 'Relaxation',
          startMin: cursor,
          endMin: cursor + relaxDuration,
          blockType: 'task',
          isSelfCare: true,
          priority: 5,
          difficulty: 'easy',
          aiReason: 'Dead zone — recharge time',
        }));
        cursor += relaxDuration + 5; // + breathing gap
        continue;
      }

      // Try to place a task
      let placed = false;

      for (const ranked of rankedTasks) {
        if (taskUsed.has(ranked.task.id)) continue;

        const taskDuration = ranked.task.estimated_minutes || ranked.task.ai_estimated_minutes || 30;
        if (taskDuration > remaining) continue;

        // Difficulty/zone matching
        const taskDiff = ranked.task.difficulty || 'medium';
        if (zone === 'peak' && taskDiff === 'easy' && rankedTasks.some(
          (r) => !taskUsed.has(r.task.id) && (r.task.difficulty === 'hard' || r.task.difficulty === 'medium')
            && (r.task.estimated_minutes || 30) <= remaining
        )) {
          // Skip easy tasks during peak if harder tasks available
          continue;
        }
        if (zone === 'low' && taskDiff === 'hard') continue; // Skip hard during low zone

        const cat = categories.find((c) => c.id === ranked.task.category_id);
        blocks.push(makeBlock({
          title: ranked.task.title,
          startMin: cursor,
          endMin: cursor + taskDuration,
          blockType: 'task',
          categoryId: ranked.task.category_id,
          taskId: ranked.task.id,
          isProtected: cat?.isProtected ?? false,
          priority: ranked.score,
          difficulty: taskDiff,
          aiReason: `Priority ${ranked.task.priority}, ${zone || 'normal'} zone`,
        }));

        taskUsed.add(ranked.task.id);
        const catId = ranked.task.category_id;
        if (catId) categoryBlockCount.set(catId, (categoryBlockCount.get(catId) || 0) + 1);
        cursor += taskDuration + 5; // + breathing gap
        placed = true;
        break;
      }

      // Fallback: fill from category ranking
      if (!placed) {
        let categoryPlaced = false;

        for (const { category } of rankedCategories) {
          const count = categoryBlockCount.get(category.id) || 0;
          const neglect = neglectScores?.get(category.id) || 0;
          const maxBlocks = neglect > 60 ? 3 : 2;
          if (count >= maxBlocks) continue;

          const blockDuration = getBlockDuration(category, energyLevel);
          if (blockDuration > remaining) continue;

          // Zone-appropriate difficulty for category blocks
          if (zone === 'low' && category.priority > 7) continue;

          blocks.push(makeBlock({
            title: category.name,
            startMin: cursor,
            endMin: cursor + blockDuration,
            blockType: 'task',
            categoryId: category.id,
            isProtected: category.isProtected,
            priority: category.priority,
            difficulty: category.priority >= 8 ? 'hard' : category.priority >= 5 ? 'medium' : 'easy',
            aiReason: `Category fill, ${zone || 'normal'} zone`,
          }));

          categoryBlockCount.set(category.id, count + 1);
          cursor += blockDuration + 5;
          categoryPlaced = true;
          break;
        }

        if (!categoryPlaced) break; // Nothing more to place in this slot
      }
    }
  }

  // ─── PHASE 5: OVERLAP RESOLUTION ──────────────────────────────
  blocks.sort((a, b) => a.startMin - b.startMin || b.priority - a.priority);

  const resolved: InternalBlock[] = [];
  for (const block of blocks) {
    const overlap = resolved.find(
      (r) => block.startMin < r.endMin && block.endMin > r.startMin
    );

    if (!overlap) {
      resolved.push(block);
      continue;
    }

    // Never compress meals, self-care, fixed blocks, or buffers from phase 1
    if (block.isMeal || block.isSelfCare || block.isFixed || (block.isBuffer && block.priority >= 90)) {
      // Shift the overlapping block if it's lower priority
      if (block.priority > overlap.priority) {
        overlap.startMin = block.endMin;
        if (overlap.startMin >= overlap.endMin) {
          // Remove the lower-priority block
          const idx = resolved.indexOf(overlap);
          if (idx >= 0) resolved.splice(idx, 1);
        }
        resolved.push(block);
      }
      // Otherwise skip the current block
      continue;
    }

    // Shift this block to after the overlapping one
    const shiftedStart = overlap.endMin;
    const duration = block.endMin - block.startMin;
    if (shiftedStart + duration <= windDownMin) {
      block.startMin = shiftedStart;
      block.endMin = shiftedStart + duration;
      resolved.push(block);
    }
    // else: block doesn't fit, dropped
  }

  // ─── CONVERT TO OUTPUT ─────────────────────────────────────────
  resolved.sort((a, b) => a.startMin - b.startMin);

  return resolved.map((b) => ({
    profile_id: profileId,
    task_id: b.taskId ?? null,
    category_id: b.categoryId ?? null,
    title: b.title,
    date,
    start_time: minutesToTime(b.startMin),
    end_time: minutesToTime(b.endMin),
    duration_minutes: b.endMin - b.startMin,
    status: 'pending' as const,
    is_fixed: b.isFixed,
    is_protected: b.isProtected,
    is_transition: b.isTransition,
    is_travel: b.isTravel,
    is_prep: false,
    block_type: b.blockType,
    is_meal: b.isMeal,
    is_self_care: b.isSelfCare,
    is_buffer: b.isBuffer,
    is_chore_block: b.isChoreBlock,
    difficulty: b.difficulty ?? null,
    ai_reason: b.aiReason ?? null,
    notes: null,
    completed_at: null,
  }));
}

// ─── Internal Helpers ────────────────────────────────────────────

interface InternalBlock {
  title: string;
  startMin: number;
  endMin: number;
  blockType: string;
  categoryId?: string | null;
  taskId?: string | null;
  locationId?: string | null;
  isFixed: boolean;
  isProtected: boolean;
  isTransition: boolean;
  isTravel: boolean;
  isMeal: boolean;
  isSelfCare: boolean;
  isBuffer: boolean;
  isChoreBlock: boolean;
  difficulty?: TaskDifficulty | null;
  priority: number;
  aiReason?: string | null;
}

interface MakeBlockOpts {
  title: string;
  startMin: number;
  endMin: number;
  blockType: string;
  categoryId?: string | null;
  taskId?: string | null;
  locationId?: string | null;
  isFixed?: boolean;
  isProtected?: boolean;
  isTransition?: boolean;
  isTravel?: boolean;
  isMeal?: boolean;
  isSelfCare?: boolean;
  isBuffer?: boolean;
  isChoreBlock?: boolean;
  difficulty?: TaskDifficulty | null;
  priority?: number;
  aiReason?: string | null;
}

function makeBlock(opts: MakeBlockOpts): InternalBlock {
  return {
    title: opts.title,
    startMin: opts.startMin,
    endMin: opts.endMin,
    blockType: opts.blockType,
    categoryId: opts.categoryId ?? null,
    taskId: opts.taskId ?? null,
    locationId: opts.locationId ?? null,
    isFixed: opts.isFixed ?? false,
    isProtected: opts.isProtected ?? false,
    isTransition: opts.isTransition ?? false,
    isTravel: opts.isTravel ?? false,
    isMeal: opts.isMeal ?? false,
    isSelfCare: opts.isSelfCare ?? false,
    isBuffer: opts.isBuffer ?? false,
    isChoreBlock: opts.isChoreBlock ?? false,
    difficulty: opts.difficulty ?? null,
    priority: opts.priority ?? 0,
    aiReason: opts.aiReason ?? null,
  };
}

interface Slot {
  startMin: number;
  endMin: number;
}

function findFreeSlots(wakeMin: number, windDownMin: number, blocks: InternalBlock[]): Slot[] {
  const free: Slot[] = [];
  let cursor = wakeMin;

  for (const block of blocks) {
    if (cursor < block.startMin) {
      free.push({ startMin: cursor, endMin: block.startMin });
    }
    cursor = Math.max(cursor, block.endMin);
  }

  if (cursor < windDownMin) {
    free.push({ startMin: cursor, endMin: windDownMin });
  }

  return free;
}

function getZoneAt(minuteOfDay: number, zones: ProductivityZone[]): 'peak' | 'low' | 'dead' | null {
  for (const zone of zones) {
    const zStart = parseTimeToMinutes(zone.start_time);
    const zEnd = parseTimeToMinutes(zone.end_time);
    if (minuteOfDay >= zStart && minuteOfDay < zEnd) {
      return zone.zone_type;
    }
  }
  return null;
}

interface RankedTask {
  task: Task;
  score: number;
}

function rankTasks(
  tasks: Task[],
  categories: Category[],
  neglectScores: Map<string, number>,
  energyLevel: EnergyLevel
): RankedTask[] {
  return tasks
    .map((task) => {
      let score = 0;

      // Priority score
      switch (task.priority) {
        case 'immediately': score += 30; break;
        case 'soon': score += 15; break;
        case 'whenever': score += 5; break;
      }

      // Category priority
      const cat = categories.find((c) => c.id === task.category_id);
      if (cat) score += cat.priority;

      // Neglect boost
      const neglect = task.category_id ? (neglectScores.get(task.category_id) || 0) : 0;
      score += (neglect / 100) * 10;

      // Due date urgency
      if (task.due_date) {
        const daysUntilDue = Math.floor(
          (new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilDue <= 0) score += 20; // Overdue
        else if (daysUntilDue <= 1) score += 15;
        else if (daysUntilDue <= 3) score += 8;
      }

      // Energy match bonus
      const diff = task.difficulty || 'medium';
      if (energyLevel === 'high' && diff === 'hard') score += 5;
      if (energyLevel === 'low' && diff === 'easy') score += 5;

      return { task, score };
    })
    .sort((a, b) => b.score - a.score);
}

function getBlockDuration(category: Category, energyLevel: EnergyLevel): number {
  const base = category.defaultBlockMinutes;
  switch (energyLevel) {
    case 'low':
      return Math.max(Math.round(base * 0.7), 15);
    case 'high':
      return Math.round(base * 1.2);
    default:
      return base;
  }
}
