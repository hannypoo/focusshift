import { Battery, BatteryLow, BatteryFull } from 'lucide-react';
import type { EnergyLevel } from '../types';

interface EnergyCheckInProps {
  onSelect: (level: EnergyLevel) => void;
}

const LEVELS: { level: EnergyLevel; label: string; desc: string; icon: typeof Battery }[] = [
  { level: 'low', label: 'Low', desc: 'Shorter blocks, lighter tasks', icon: BatteryLow },
  { level: 'medium', label: 'Medium', desc: 'Standard schedule', icon: Battery },
  { level: 'high', label: 'High', desc: 'Longer blocks, harder tasks first', icon: BatteryFull },
];

export default function EnergyCheckIn({ onSelect }: EnergyCheckInProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <h2 className="text-2xl font-bold text-white mb-2">Good morning</h2>
      <p className="text-white/50 mb-8">How's your energy today?</p>

      <div className="w-full max-w-xs space-y-3">
        {LEVELS.map(({ level, label, desc, icon: Icon }) => (
          <button
            key={level}
            onClick={() => onSelect(level)}
            className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all"
          >
            <Icon size={28} className="text-indigo-400 flex-shrink-0" />
            <div className="text-left">
              <div className="font-semibold text-white">{label}</div>
              <div className="text-sm text-white/50">{desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
