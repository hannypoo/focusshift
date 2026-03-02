import { useState } from 'react';
import { Phone, ShoppingBag, AlertTriangle, Coffee, X } from 'lucide-react';
import type { InterruptionType } from '../types';

interface InterruptionModalProps {
  onConfirm: (type: InterruptionType, duration: number, note?: string) => void;
  onCancel: () => void;
}

const TYPES: { type: InterruptionType; label: string; icon: typeof Phone; defaultMin: number }[] = [
  { type: 'phone_call', label: 'Phone Call', icon: Phone, defaultMin: 15 },
  { type: 'errand', label: 'Errand', icon: ShoppingBag, defaultMin: 30 },
  { type: 'emergency', label: 'Emergency', icon: AlertTriangle, defaultMin: 60 },
  { type: 'break', label: 'Break', icon: Coffee, defaultMin: 10 },
];

const DURATIONS = [5, 10, 15, 20, 30, 45, 60, 90];

export default function InterruptionModal({ onConfirm, onCancel }: InterruptionModalProps) {
  const [step, setStep] = useState<'type' | 'duration'>('type');
  const [selectedType, setSelectedType] = useState<InterruptionType | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(15);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={onCancel}>
      <div
        className="w-full max-w-lg bg-slate-900 rounded-t-3xl border-t border-white/10 p-6 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">
            {step === 'type' ? "What's happening?" : 'How long?'}
          </h3>
          <button onClick={onCancel} className="text-white/40 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        {step === 'type' ? (
          <div className="grid grid-cols-2 gap-3">
            {TYPES.map(({ type, label, icon: Icon, defaultMin }) => (
              <button
                key={type}
                onClick={() => {
                  setSelectedType(type);
                  setSelectedDuration(defaultMin);
                  setStep('duration');
                }}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all min-h-[100px]"
              >
                <Icon size={28} className="text-white/70" />
                <span className="text-sm font-medium text-white/80">{label}</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDuration(d)}
                  className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                    selectedDuration === d
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>
            <button
              onClick={() => onConfirm(selectedType!, selectedDuration)}
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl transition-colors text-lg"
            >
              Pause schedule
            </button>
            <p className="text-center text-white/30 text-xs mt-3">
              Your schedule will adapt — nothing is "missed"
            </p>
          </>
        )}
      </div>
    </div>
  );
}
