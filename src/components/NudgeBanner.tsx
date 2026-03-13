import { useState, useEffect } from 'react';
import { X, Sparkles, Clock, Zap, Coffee, Heart, Bell } from 'lucide-react';
import type { Nudge } from '../hooks/useNudges';

const NUDGE_ICONS: Record<string, typeof Sparkles> = {
  momentum: Sparkles,
  transition: Clock,
  energy: Zap,
  break: Coffee,
  encouragement: Heart,
  reminder: Bell,
};

const NUDGE_COLORS: Record<string, string> = {
  momentum: 'from-amber-500/20 to-amber-500/5 border-amber-500/20',
  transition: 'from-blue-500/20 to-blue-500/5 border-blue-500/20',
  energy: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20',
  break: 'from-teal-500/20 to-teal-500/5 border-teal-500/20',
  encouragement: 'from-pink-500/20 to-pink-500/5 border-pink-500/20',
  reminder: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/20',
};

const NUDGE_ICON_COLORS: Record<string, string> = {
  momentum: 'text-amber-400',
  transition: 'text-blue-400',
  energy: 'text-emerald-400',
  break: 'text-teal-400',
  encouragement: 'text-pink-400',
  reminder: 'text-indigo-400',
};

interface NudgeBannerProps {
  nudge: Nudge;
  onDismiss: () => void;
}

export default function NudgeBanner({ nudge, onDismiss }: NudgeBannerProps) {
  const [visible, setVisible] = useState(false);
  const Icon = NUDGE_ICONS[nudge.type] || Sparkles;
  const colors = NUDGE_COLORS[nudge.type] || NUDGE_COLORS.encouragement;
  const iconColor = NUDGE_ICON_COLORS[nudge.type] || 'text-white/60';

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 200);
  };

  return (
    <div
      className={`mx-2 mb-3 rounded-2xl bg-gradient-to-r ${colors} border p-3 transition-all duration-200 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon size={18} className={`${iconColor} mt-0.5 shrink-0`} />
        <p className="flex-1 text-sm text-white/80 leading-relaxed">{nudge.message}</p>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
