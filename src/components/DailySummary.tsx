import { useState, useMemo } from 'react';
import { X, Smile, Meh, Frown, SmilePlus, Angry } from 'lucide-react';
import { toast } from 'sonner';
import { useScheduleBlocks } from '../hooks/useScheduleBlocks';
import { useUpsertDailySummary } from '../hooks/useDailySummary';
import { getToday } from '../lib/utils';

const MOOD_OPTIONS = [
  { rating: 1, icon: Angry, label: 'Rough', color: 'text-red-400' },
  { rating: 2, icon: Frown, label: 'Meh', color: 'text-orange-400' },
  { rating: 3, icon: Meh, label: 'Okay', color: 'text-yellow-400' },
  { rating: 4, icon: Smile, label: 'Good', color: 'text-green-400' },
  { rating: 5, icon: SmilePlus, label: 'Great', color: 'text-emerald-400' },
];

const SKIP_REASONS = [
  'Ran out of time',
  "Didn't feel like it",
  'Something came up',
  'Too tired',
  'Forgot',
];

interface DailySummaryProps {
  onClose: () => void;
}

export default function DailySummary({ onClose }: DailySummaryProps) {
  const today = getToday();
  const { data: blocks } = useScheduleBlocks(today);
  const upsertSummary = useUpsertDailySummary();

  const [mood, setMood] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  const stats = useMemo(() => {
    if (!blocks) return { completed: 0, missed: 0, skipped: 0, productive: 0, hardDone: 0, total: 0 };
    const real = blocks.filter((b) => !b.is_transition && !b.is_travel && !b.is_buffer);
    return {
      completed: real.filter((b) => b.status === 'completed').length,
      missed: real.filter((b) => b.status === 'pending').length,
      skipped: real.filter((b) => b.status === 'skipped').length,
      productive: real.filter((b) => b.status === 'completed').reduce((s, b) => s + b.duration_minutes, 0),
      hardDone: real.filter((b) => b.status === 'completed' && b.difficulty === 'hard').length,
      total: real.length,
    };
  }, [blocks]);

  const percent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const toggleReason = (reason: string) =>
    setSelectedReasons((prev) => prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]);

  const handleSave = async () => {
    const reasonNotes = selectedReasons.length > 0
      ? `Missed block reasons: ${selectedReasons.join(', ')}${notes ? `\n${notes}` : ''}`
      : notes;

    await upsertSummary.mutateAsync({
      date: today,
      blocks_completed: stats.completed,
      blocks_missed: stats.missed,
      blocks_skipped: stats.skipped,
      total_productive_minutes: stats.productive,
      hard_tasks_completed: stats.hardDone,
      mood_rating: mood ?? undefined,
      user_notes: reasonNotes || undefined,
    });

    toast.success('Day summary saved');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl border border-white/10 overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-lg font-bold text-white">Day Summary</h2>
          <button onClick={onClose} className="p-1 text-white/30 hover:text-white/60">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Progress ring */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none"
                  stroke={percent >= 80 ? '#22c55e' : percent >= 50 ? '#eab308' : '#ef4444'}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${percent * 2.64} 264`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{percent}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-white"><strong>{stats.completed}</strong> completed</p>
              {stats.skipped > 0 && <p className="text-xs text-white/40">{stats.skipped} skipped</p>}
              {stats.missed > 0 && <p className="text-xs text-white/40">{stats.missed} still pending</p>}
              <p className="text-xs text-white/30">{stats.productive} productive minutes</p>
              {stats.hardDone > 0 && <p className="text-xs text-amber-400">{stats.hardDone} hard tasks done!</p>}
            </div>
          </div>

          {/* Missed block reasons */}
          {(stats.missed > 0 || stats.skipped > 0) && (
            <div className="space-y-2">
              <p className="text-xs text-white/40">What got in the way?</p>
              <div className="flex flex-wrap gap-2">
                {SKIP_REASONS.map((reason) => (
                  <button key={reason} onClick={() => toggleReason(reason)}
                    className={`px-3 py-2 rounded-xl text-xs transition-colors ${
                      selectedReasons.includes(reason)
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                        : 'bg-white/5 text-white/40 border border-white/5'
                    }`}>
                    {reason}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mood rating */}
          <div className="space-y-2">
            <p className="text-xs text-white/40">How are you feeling?</p>
            <div className="flex gap-2 justify-center">
              {MOOD_OPTIONS.map(({ rating, icon: Icon, label, color }) => (
                <button key={rating} onClick={() => setMood(rating)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[56px] ${
                    mood === rating
                      ? 'bg-white/10 scale-110'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}>
                  <Icon size={24} className={mood === rating ? color : 'text-white/20'} />
                  <span className="text-[10px] text-white/30">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <p className="text-xs text-white/40">Any notes? (optional)</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="How the day went..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none resize-none"
            />
          </div>

          {/* Save */}
          <button onClick={handleSave}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white transition-colors">
            Save Summary
          </button>
        </div>
      </div>
    </div>
  );
}
