import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { getRandomAffirmation, getHardTaskAffirmation, getStreakAffirmation } from '../data/affirmations';
import { getCategoryColors } from '../lib/utils';
import { Gift, Flame } from 'lucide-react';
import type { TaskDifficulty } from '../types/database';

interface CelebrationProps {
  categoryColor: string;
  categoryName: string;
  onContinue: () => void;
  enableConfetti: boolean;
  difficulty?: TaskDifficulty | null;
  treatSuggestion?: string | null;
  streak?: number;
}

export default function Celebration({
  categoryColor,
  categoryName,
  onContinue,
  enableConfetti,
  difficulty,
  treatSuggestion,
  streak,
}: CelebrationProps) {
  const isHard = difficulty === 'hard';
  const affirmation = useRef(isHard ? getHardTaskAffirmation() : getRandomAffirmation());
  const streakMessage = useRef(streak && streak > 1 ? getStreakAffirmation(streak) : null);
  const colors = getCategoryColors(categoryColor);

  useEffect(() => {
    if (enableConfetti) {
      const intensity = isHard ? 120 : 60;
      confetti({
        particleCount: intensity,
        spread: isHard ? 100 : 60,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#a855f7', '#f43f5e', '#f97316', '#14b8a6'],
        disableForReducedMotion: true,
      });
    }
  }, [enableConfetti, isHard]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 animate-celebrate">
      {/* Checkmark */}
      <div className={`w-24 h-24 rounded-full ${colors.bgLight} flex items-center justify-center mb-6`}>
        {isHard ? (
          <Flame size={48} className="text-amber-400" />
        ) : (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={colors.text}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>

      {/* Category completed */}
      <p className="text-white/50 text-sm mb-2">
        {categoryName} — complete
        {isHard && <span className="text-amber-400 ml-1">(Hard!)</span>}
      </p>

      {/* Affirmation */}
      <h2 className="text-2xl font-bold text-white text-center mb-4">
        {affirmation.current}
      </h2>

      {/* Treat suggestion */}
      {treatSuggestion && (
        <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3 mb-4">
          <Gift size={18} className="text-indigo-400 shrink-0" />
          <p className="text-sm text-indigo-300">{treatSuggestion}</p>
        </div>
      )}

      {/* Streak */}
      {streakMessage.current && (
        <p className="text-xs text-white/30 mb-6">{streakMessage.current}</p>
      )}

      {/* Continue button */}
      <button
        onClick={onContinue}
        className="w-full max-w-xs h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl transition-colors text-lg"
      >
        Next up
      </button>
    </div>
  );
}
