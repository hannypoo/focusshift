import { Gift, Star, Flame } from 'lucide-react';
import type { TaskDifficulty } from '../types/database';

interface RewardToastProps {
  message: string;
  treatSuggestion: string | null;
  difficulty?: TaskDifficulty | null;
  streak?: number;
}

export default function RewardToast({ message, treatSuggestion, difficulty, streak }: RewardToastProps) {
  const isHard = difficulty === 'hard';
  const isMedium = difficulty === 'medium';

  return (
    <div className="flex items-start gap-3 p-1">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        isHard ? 'bg-amber-500/20' : isMedium ? 'bg-indigo-500/20' : 'bg-green-500/20'
      }`}>
        {isHard ? <Flame size={20} className="text-amber-400" /> :
         isMedium ? <Star size={20} className="text-indigo-400" /> :
         <Gift size={20} className="text-green-400" />}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{message}</p>
        {treatSuggestion && (
          <p className="text-xs text-indigo-400 mt-0.5">
            You've earned it: {treatSuggestion}
          </p>
        )}
        {streak && streak > 1 && (
          <p className="text-[11px] text-white/30 mt-0.5">
            {streak} day streak!
          </p>
        )}
      </div>
    </div>
  );
}
