import { Timer, FastForward } from 'lucide-react';

interface HyperfocusPromptProps {
  blockTitle: string;
  extendCount: number;
  onExtend: (minutes: number) => void;
  onDismiss: () => void;
}

export default function HyperfocusPrompt({
  blockTitle,
  extendCount,
  onExtend,
  onDismiss,
}: HyperfocusPromptProps) {
  const canExtend = extendCount < 2;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-fade-in-up">
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 backdrop-blur-lg">
        <div className="flex items-start gap-3">
          <Timer size={20} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-200">
              5 minutes left on {blockTitle}
            </p>
            {canExtend && (
              <p className="text-xs text-amber-200/60 mt-1">
                Need more time? You can extend ({2 - extendCount} left)
              </p>
            )}
            <div className="flex gap-2 mt-3">
              {canExtend && (
                <button
                  onClick={() => onExtend(15)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-xl transition-colors"
                >
                  <FastForward size={14} />
                  +15 min
                </button>
              )}
              <button
                onClick={onDismiss}
                className="px-3 py-2 text-xs font-medium text-white/50 hover:text-white/70 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
