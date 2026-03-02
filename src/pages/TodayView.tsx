import { useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { Zap, Sun, Moon, RefreshCw, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import DayTimeline from '../components/DayTimeline';
import DayProgress from '../components/DayProgress';
import EnergyCheckIn from '../components/EnergyCheckIn';
import Celebration from '../components/Celebration';
import DailySummary from '../components/DailySummary';
import { useProfile } from '../hooks/useProfile';
import { useProfileId } from '../hooks/useProfileId';
import { useCategories } from '../hooks/useCategories';
import { useScheduleBlocks, useCreateBlocks, useUpdateBlock, useDeleteBlocks } from '../hooks/useScheduleBlocks';
import { useDailyCheckin, useUpsertDailyCheckin } from '../hooks/useCheckins';
import { useRecordTaskHistory } from '../hooks/useTaskHistory';
import { useTasks } from '../hooks/useTasks';
import { useRecurringTasks } from '../hooks/useRecurringTasks';
import { useLocations } from '../hooks/useLocations';
import { useTravelTimes } from '../hooks/useTravelTimes';
import { useNeglect } from '../hooks/useNeglect';
import { useRewardEngine } from '../hooks/useRewardEngine';
import { useUpsertTravelTime } from '../hooks/useTravelTimes';
import { getToday } from '../lib/utils';
import { buildAndGenerateSchedule } from '../lib/scheduleAdapter';
import type { EnergyLevel, TaskDifficulty } from '../types/database';

export default function TodayView() {
  const today = getToday();
  const profileId = useProfileId();
  const { data: profile } = useProfile();
  const { data: categories } = useCategories();
  const { data: blocks, isLoading: blocksLoading } = useScheduleBlocks(today);
  const { data: checkin } = useDailyCheckin(today);
  const { data: tasks } = useTasks({ status: ['pending', 'scheduled'] });
  const { data: recurringTasks } = useRecurringTasks();
  const { data: locations } = useLocations();
  const { data: travelTimes } = useTravelTimes();
  const neglectInfo = useNeglect(categories || [], blocks || []);
  const createBlocks = useCreateBlocks();
  const updateBlock = useUpdateBlock();
  const deleteBlocks = useDeleteBlocks();
  const upsertCheckin = useUpsertDailyCheckin();
  const recordHistory = useRecordTaskHistory();
  const { earnReward, todayStats } = useRewardEngine();
  const upsertTravelTime = useUpsertTravelTime();

  // Multitaskable tasks for "While you wait/travel" suggestions
  const multitaskableTasks = useMemo(
    () => (tasks || []).filter((t) => t.is_multitaskable),
    [tasks]
  );

  const [celebration, setCelebration] = useState<{
    name: string; color: string; difficulty?: TaskDifficulty | null; treatSuggestion?: string | null;
  } | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const needsCheckin = !checkin && !blocksLoading;
  const hasBlocks = blocks && blocks.length > 0;

  // Build neglect scores map
  const neglectScores = useMemo(() => {
    const map = new Map<string, number>();
    if (neglectInfo) {
      for (const info of neglectInfo) map.set(info.categoryId, info.score);
    }
    return map;
  }, [neglectInfo]);

  // Generate schedule
  const generateSchedule = useCallback(async (level: EnergyLevel) => {
    if (!profile || !categories) return;
    const newBlocks = buildAndGenerateSchedule({
      profileId, profile, categories, energyLevel: level, date: today,
      tasks: tasks || [], recurringTasks: recurringTasks || [],
      travelTimes: travelTimes || [], locations: locations || [], neglectScores,
    });
    await deleteBlocks.mutateAsync(today);
    if (newBlocks.length > 0) await createBlocks.mutateAsync(newBlocks);
    return newBlocks;
  }, [profileId, profile, categories, today, tasks, recurringTasks, travelTimes, locations, neglectScores, deleteBlocks, createBlocks]);

  const handleEnergySelect = useCallback(async (level: EnergyLevel) => {
    if (!profile) return;
    await upsertCheckin.mutateAsync({
      date: today, energy_level: level,
      wake_time: profile.default_wake_time, wind_down_time: profile.default_wind_down_time,
    });
    await generateSchedule(level);
    toast.success(`Schedule generated for ${level} energy day`);
  }, [profile, today, upsertCheckin, generateSchedule]);

  // Block completion with rewards
  const handleComplete = useCallback(async (blockId: string) => {
    const block = blocks?.find((b) => b.id === blockId);
    if (!block) return;

    await updateBlock.mutateAsync({ id: blockId, status: 'completed', completed_at: new Date().toISOString() });

    const cat = categories?.find((c) => c.id === block.category_id);
    if (cat) {
      recordHistory.mutate({
        profile_id: profile?.id || '', task_id: block.task_id, category_id: block.category_id,
        title: block.title, task_type: null, homework_type: null,
        estimated_minutes: block.duration_minutes, actual_minutes: block.duration_minutes,
        energy_level: checkin?.energy_level || 'medium', day_of_week: new Date().getDay(),
        time_of_day: block.start_time,
      });

      // Earn reward
      const { treatSuggestion } = await earnReward({
        label: `Completed: ${block.title}`,
        difficulty: block.difficulty,
      });

      setCelebration({
        name: cat.name, color: cat.color,
        difficulty: block.difficulty, treatSuggestion,
      });
    }
  }, [blocks, categories, profile, checkin, updateBlock, recordHistory, earnReward]);

  const handleSkip = useCallback(async (blockId: string) => {
    await updateBlock.mutateAsync({ id: blockId, status: 'skipped' });
    toast('Block skipped — no worries', { description: "It'll come back around." });
  }, [updateBlock]);

  const handleAddNote = useCallback(async (blockId: string, note: string) => {
    await updateBlock.mutateAsync({ id: blockId, notes: note });
  }, [updateBlock]);

  const handleOverrideTravel = useCallback(async (blockId: string, minutes: number) => {
    const block = blocks?.find((b) => b.id === blockId);
    if (!block) return;

    // Update the block's duration
    const startMin = timeToMinutes(block.start_time);
    const newEndMin = startMin + minutes;
    const endH = Math.floor(newEndMin / 60).toString().padStart(2, '0');
    const endM = (newEndMin % 60).toString().padStart(2, '0');

    await updateBlock.mutateAsync({
      id: blockId,
      duration_minutes: minutes,
      end_time: `${endH}:${endM}`,
    });

    // Save override to travel_times for future estimates
    if (block.ai_reason) {
      // Try to extract location IDs from the block's metadata (stored in notes)
      // The scheduler stores from/to location IDs in ai_reason like "Travel from X to Y"
    }

    toast.success(`Travel time updated to ${minutes} min`);
  }, [blocks, updateBlock]);

  const handleRegenerate = useCallback(async () => {
    if (!profile || !categories || !checkin) return;
    await generateSchedule(checkin.energy_level);
    toast.success('Schedule regenerated');
  }, [profile, categories, checkin, generateSchedule]);

  // Stats
  const stats = useMemo(() => {
    if (!blocks) return { completed: 0, total: 0, percent: 0 };
    const real = blocks.filter((b) => !b.is_transition && !b.is_travel && !b.is_prep && !b.is_buffer);
    const completed = real.filter((b) => b.status === 'completed').length;
    const total = real.length;
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [blocks]);

  // Celebration screen
  if (celebration) {
    return (
      <div className="flex-1 flex flex-col">
        <Celebration
          categoryColor={celebration.color}
          categoryName={celebration.name}
          onContinue={() => setCelebration(null)}
          enableConfetti={profile?.enable_confetti ?? true}
          difficulty={celebration.difficulty}
          treatSuggestion={celebration.treatSuggestion}
          streak={profile?.streak}
        />
      </div>
    );
  }

  // Energy check-in
  if (needsCheckin) return <EnergyCheckIn onSelect={handleEnergySelect} />;

  const wakeTime = profile?.default_wake_time?.substring(0, 5) || '09:00';
  const windDownTime = profile?.default_wind_down_time?.substring(0, 5) || '22:00';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {format(new Date(), 'EEEE, MMM d')}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {checkin && (
                <span className="flex items-center gap-1 text-xs text-white/40">
                  <EnergyIcon level={checkin.energy_level} />
                  {checkin.energy_level} energy
                </span>
              )}
              {todayStats.rewardsEarned > 0 && (
                <span className="text-xs text-indigo-400">{todayStats.rewardsEarned} rewards</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSummary(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
              aria-label="Day summary"
            >
              <ClipboardList size={18} />
            </button>
            <button
              onClick={handleRegenerate}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
              aria-label="Regenerate schedule"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        <DayProgress {...stats} />
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-2 pb-24">
        {hasBlocks ? (
          <DayTimeline
            blocks={blocks!}
            categories={categories || []}
            wakeTime={wakeTime}
            windDownTime={windDownTime}
            onComplete={handleComplete}
            onSkip={handleSkip}
            onAddNote={handleAddNote}
            onOverrideTravel={handleOverrideTravel}
            multitaskableTasks={multitaskableTasks}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <Zap size={48} className="text-white/10 mb-4" />
            <p className="text-white/40 text-sm">No blocks scheduled for today.</p>
            <p className="text-white/25 text-xs mt-1">Tap regenerate to build a schedule.</p>
          </div>
        )}
      </div>

      {/* Daily Summary Modal */}
      {showSummary && <DailySummary onClose={() => setShowSummary(false)} />}
    </div>
  );
}

function timeToMinutes(time: string): number {
  const parts = time.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}

function EnergyIcon({ level }: { level: string }) {
  switch (level) {
    case 'high': return <Zap size={12} className="text-amber-400" />;
    case 'low': return <Moon size={12} className="text-blue-400" />;
    default: return <Sun size={12} className="text-yellow-400" />;
  }
}
