import { Battery, BatteryLow, BatteryFull, X } from 'lucide-react';
import type { EnergyLevel } from '../types';

interface EnergyCheckModalProps {
  currentLevel: EnergyLevel;
  onSelect: (level: EnergyLevel) => void;
  onClose: () => void;
}

const LEVELS: {
  level: EnergyLevel;
  label: string;
  desc: string;
  icon: typeof Battery;
  tint: string;
  ring: string;
}[] = [
  {
    level: 'low',
    label: "I'm crashing",
    desc: 'Shorter blocks, easier tasks, more breaks',
    icon: BatteryLow,
    tint: 'text-blue-400',
    ring: 'ring-blue-400/50',
  },
  {
    level: 'medium',
    label: "I'm steady",
    desc: 'Balanced schedule',
    icon: Battery,
    tint: 'text-yellow-400',
    ring: 'ring-yellow-400/50',
  },
  {
    level: 'high',
    label: "I'm locked in",
    desc: 'Longer blocks, harder tasks first, tighter flow',
    icon: BatteryFull,
    tint: 'text-green-400',
    ring: 'ring-green-400/50',
  },
];

export default function EnergyCheckModal({ currentLevel, onSelect, onClose }: EnergyCheckModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-[#1a1a2e] border-t border-white/10 rounded-t-2xl p-5 pb-8 animate-slide-up">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-white">Adjust energy</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-white/40 mb-5">Your remaining schedule will adjust</p>

        <div className="space-y-3">
          {LEVELS.map(({ level, label, desc, icon: Icon, tint, ring }) => {
            const isCurrent = level === currentLevel;
            return (
              <button
                key={level}
                onClick={() => onSelect(level)}
                className={`w-full flex items-center gap-4 p-4 min-h-[56px] rounded-2xl border transition-all
                  ${isCurrent
                    ? `bg-white/10 border-white/20 ring-2 ${ring}`
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15'
                  }`}
                aria-pressed={isCurrent}
              >
                <Icon size={28} className={`${tint} flex-shrink-0`} />
                <div className="text-left">
                  <div className="font-semibold text-white">{label}</div>
                  <div className="text-sm text-white/50">{desc}</div>
                </div>
                {isCurrent && (
                  <span className="ml-auto text-xs text-white/30 flex-shrink-0">current</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
