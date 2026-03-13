import { useEffect } from 'react';
import { X, Trophy, Clock, Zap, Target, Heart, Star, TrendingUp, AlertCircle, Brain, Loader2 } from 'lucide-react';
import { useCoaching } from '../hooks/useCoaching';

const ICON_MAP: Record<string, typeof Trophy> = {
  trophy: Trophy,
  clock: Clock,
  zap: Zap,
  target: Target,
  heart: Heart,
  star: Star,
  'trending-up': TrendingUp,
  'alert-circle': AlertCircle,
};

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  celebration: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
  strength: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  pattern: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400' },
  suggestion: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
};

interface CoachingPanelProps {
  onClose: () => void;
}

export default function CoachingPanel({ onClose }: CoachingPanelProps) {
  const { data, isLoading, error, fetchCoaching } = useCoaching();

  useEffect(() => {
    fetchCoaching(7);
  }, [fetchCoaching]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/98 backdrop-blur-lg animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Brain size={20} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">AI Coach — Weekly Insights</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-white/10 text-white/40 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={32} className="text-indigo-400 animate-spin" />
            <p className="text-white/40 text-sm">Analyzing your week...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <AlertCircle size={32} className="text-red-400/50 mx-auto mb-3" />
            <p className="text-white/40 text-sm">{error}</p>
            <button
              onClick={() => fetchCoaching(7)}
              className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {data && (
          <>
            {/* Productivity Score */}
            {data.productivity_score !== null && (
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <div className="relative w-16 h-16">
                  <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/5" />
                    <circle
                      cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3"
                      strokeDasharray={`${data.productivity_score} 100`}
                      strokeLinecap="round"
                      className="text-indigo-400"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
                    {data.productivity_score}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Productivity Score</p>
                  <p className="text-xs text-white/40 mt-0.5">Based on your last 7 days</p>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-sm text-white/80 leading-relaxed">{data.summary}</p>
            </div>

            {/* Insights */}
            {data.insights.map((insight, i) => {
              const colors = TYPE_COLORS[insight.type] || TYPE_COLORS.pattern;
              const IconComp = ICON_MAP[insight.icon] || Star;
              return (
                <div key={i} className={`p-4 rounded-2xl ${colors.bg} border ${colors.border}`}>
                  <div className="flex items-start gap-3">
                    <IconComp size={18} className={`${colors.text} mt-0.5 shrink-0`} />
                    <div>
                      <p className="text-sm font-medium text-white">{insight.title}</p>
                      <p className="text-xs text-white/50 mt-1 leading-relaxed">{insight.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Top Tip */}
            {data.top_tip && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <Zap size={18} className="text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-300">ADHD Pro Tip</p>
                    <p className="text-xs text-white/60 mt-1 leading-relaxed">{data.top_tip}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
