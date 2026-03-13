import { useState, useCallback, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { Zap, Sun, Moon, Battery, RefreshCw, ClipboardList, RotateCcw, Brain, Sparkles } from 'lucide-react';
import { resetDemoState } from '../lib/demoReset';
import { enrichBlocks } from '../lib/blockEnricher';
import { toast } from 'sonner';
import DayTimeline from '../components/DayTimeline';
import DayProgress from '../components/DayProgress';
import EnergyCheckModal from '../components/EnergyCheckModal';
import Celebration from '../components/Celebration';
import DailySummary from '../components/DailySummary';
import CoachingPanel from '../components/CoachingPanel';
import NudgeBanner from '../components/NudgeBanner';
import { useNudges } from '../hooks/useNudges';
import { useProfile } from '../hooks/useProfile';
import { useProfileId } from '../hooks/useProfileId';
import { useCategories } from '../hooks/useCategories';
import { useQueryClient } from '@tanstack/react-query';
import { useScheduleBlocks, useUpdateBlock } from '../hooks/useScheduleBlocks';
import { useDailyCheckin } from '../hooks/useCheckins';
import { useRecordTaskHistory } from '../hooks/useTaskHistory';
import { useTasks } from '../hooks/useTasks';
import { useRewardEngine } from '../hooks/useRewardEngine';
import { getToday } from '../lib/utils';
import type { EnergyLevel, TaskDifficulty } from '../types/database';

export default function TodayView() {
  const today = getToday();
  const profileId = useProfileId();
  const { data: profile } = useProfile();
  const { data: categories } = useCategories();
  const { data: blocks } = useScheduleBlocks(today);
  const { data: checkin } = useDailyCheckin(today);
  const { data: tasks } = useTasks({ status: ['pending', 'scheduled'] });
  // Enrich blocks with derived display properties (is_meal, block_type, difficulty, etc.)
  const enrichedBlocks = useMemo(() => enrichBlocks(blocks || []), [blocks]);

  const updateBlock = useUpdateBlock();
  const recordHistory = useRecordTaskHistory();
  const { earnReward, todayStats } = useRewardEngine();
  const queryClient = useQueryClient();

  // Multitaskable tasks for "While you wait/travel" suggestions
  const multitaskableTasks = useMemo(
    () => (tasks || []).filter((t) => t.is_multitaskable),
    [tasks]
  );

  const [celebration, setCelebration] = useState<{
    name: string; color: string; difficulty?: TaskDifficulty | null; treatSuggestion?: string | null;
  } | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showEnergyModal, setShowEnergyModal] = useState(false);
  const [showCoaching, setShowCoaching] = useState(false);
  const { nudges, isLoading: nudgesLoading, fetchNudges, getNextNudge } = useNudges();
  const [dismissedNudges, setDismissedNudges] = useState<Set<string>>(new Set());

  const hasBlocks = enrichedBlocks.length > 0;

  // Demo reset handler — reusable for both keyboard shortcut and button
  const handleDemoReset = useCallback(async () => {
    if (!profileId) return;
    try {
      await resetDemoState(profileId, today);
      queryClient.invalidateQueries({ queryKey: ['chat_messages'] });
      queryClient.invalidateQueries({ queryKey: ['schedule_blocks'] });
      toast.success('Demo reset complete');
    } catch (err) {
      console.error('Demo reset failed:', err);
      toast.error('Demo reset failed — check console');
    }
  }, [profileId, today, queryClient]);

  // Demo reset: Ctrl+Shift+R (avoiding Ctrl+Shift+D which Chrome steals for bookmarks)
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd' || e.key === 'R' || e.key === 'r')) {
        // Ctrl+Shift+R is normally hard refresh, but we preventDefault
        e.preventDefault();
        await handleDemoReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDemoReset]);

  // Mid-day energy change — demo mode: just reset and show toast
  const handleEnergyChange = useCallback(async (newLevel: EnergyLevel) => {
    await handleDemoReset();
    setShowEnergyModal(false);
    toast.success(`Energy updated to ${newLevel} — schedule adjusted`);
  }, [handleDemoReset]);

  // Block completion with rewards
  const handleComplete = useCallback(async (blockId: string) => {
    const block = enrichedBlocks.find((b) => b.id === blockId);
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
  }, [enrichedBlocks, categories, profile, checkin, updateBlock, recordHistory, earnReward]);

  const handleSkip = useCallback(async (blockId: string) => {
    await updateBlock.mutateAsync({ id: blockId, status: 'skipped' });
    toast('Block skipped — no worries', { description: "It'll come back around." });
  }, [updateBlock]);

  const handleAddNote = useCallback(async (blockId: string, note: string) => {
    await updateBlock.mutateAsync({ id: blockId, notes: note });
  }, [updateBlock]);

  const handleOverrideTravel = useCallback(async (blockId: string, minutes: number) => {
    const block = enrichedBlocks.find((b) => b.id === blockId);
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
  }, [enrichedBlocks, updateBlock]);

  const handleRegenerate = useCallback(async () => {
    await handleDemoReset();
  }, [handleDemoReset]);

  // Stats
  const stats = useMemo(() => {
    if (!enrichedBlocks.length) return { completed: 0, total: 0, percent: 0 };
    const real = enrichedBlocks.filter((b) => !b.is_transition && !b.is_travel && !b.is_prep && !b.is_buffer);
    const completed = real.filter((b) => b.status === 'completed').length;
    const total = real.length;
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [enrichedBlocks]);

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
              onClick={() => setShowCoaching(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
              aria-label="AI coaching insights"
              title="AI Coach"
            >
              <Brain size={18} />
            </button>
            <button
              onClick={() => setShowEnergyModal(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
              aria-label="Adjust energy level"
            >
              <Battery size={18} />
            </button>
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
            <button
              onClick={handleDemoReset}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/15 hover:text-white/40 transition-colors"
              aria-label="Reset demo"
              title="Reset demo (Ctrl+Shift+D)"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        <DayProgress {...stats} />
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-2 pb-24">
        {/* AI Nudge Banner */}
        {(() => {
          const nextNudge = getNextNudge();
          if (nextNudge && !dismissedNudges.has(nextNudge.message)) {
            return (
              <NudgeBanner
                nudge={nextNudge}
                onDismiss={() => setDismissedNudges((prev) => new Set(prev).add(nextNudge.message))}
              />
            );
          }
          if (hasBlocks && nudges.length === 0) {
            return (
              <button
                onClick={fetchNudges}
                disabled={nudgesLoading}
                className="mx-2 mb-3 w-[calc(100%-16px)] py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {nudgesLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                    Generating nudges...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Get AI nudges for today
                  </>
                )}
              </button>
            );
          }
          return null;
        })()}

        {hasBlocks ? (
          <DayTimeline
            blocks={enrichedBlocks}
            categories={categories || []}
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
            <p className="text-white/25 text-xs mt-1">Tap the button below to load demo schedule.</p>
            <button
              onClick={handleDemoReset}
              className="mt-4 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
            >
              Load Demo Schedule
            </button>
          </div>
        )}
      </div>

      {/* Daily Summary Modal */}
      {showSummary && <DailySummary onClose={() => setShowSummary(false)} />}

      {/* Energy Adjustment Modal */}
      {showEnergyModal && (
        <EnergyCheckModal
          currentLevel={checkin?.energy_level || 'medium'}
          onSelect={handleEnergyChange}
          onClose={() => setShowEnergyModal(false)}
        />
      )}

      {/* AI Coaching Panel */}
      {showCoaching && <CoachingPanel onClose={() => setShowCoaching(false)} />}
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
