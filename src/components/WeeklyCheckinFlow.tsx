import { useState } from 'react';
import { Calendar, Zap, Sparkles } from 'lucide-react';
import { useUpsertWeeklyCheckin } from '../hooks/useCheckins';
import { getWeekStart } from '../lib/dateUtils';

interface WeeklyCheckinFlowProps {
  onComplete: () => void;
}

const ENERGY_OPTIONS = [
  { value: 1, label: 'Very Low', emoji: '1' },
  { value: 2, label: 'Low', emoji: '2' },
  { value: 3, label: 'Medium', emoji: '3' },
  { value: 4, label: 'Good', emoji: '4' },
  { value: 5, label: 'Great', emoji: '5' },
];

export default function WeeklyCheckinFlow({ onComplete }: WeeklyCheckinFlowProps) {
  const [step, setStep] = useState(0);
  const [energy, setEnergy] = useState(3);
  const [events, setEvents] = useState('');
  const [changes, setChanges] = useState('');
  const upsertCheckin = useUpsertWeeklyCheckin();

  const handleFinish = async () => {
    await upsertCheckin.mutateAsync({
      week_start: getWeekStart(),
      energy_rating: energy,
      upcoming_events: events || null,
      changes_noted: changes || null,
      ai_schedule_notes: null,
    });
    onComplete();
  };

  if (step === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <Calendar size={48} className="text-indigo-400 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Weekly Check-in</h2>
        <p className="text-white/50 text-center mb-8">
          Quick 3 questions to plan a better week.
        </p>

        <div className="w-full max-w-xs space-y-3">
          <p className="text-sm text-white/60 mb-2">How's your energy this week?</p>
          <div className="flex gap-2">
            {ENERGY_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setEnergy(o.value)}
                className={`flex-1 py-3 rounded-xl text-center transition-colors ${
                  energy === o.value
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                    : 'bg-white/5 text-white/40 border border-white/5'
                }`}
              >
                <div className="text-lg">{o.emoji}</div>
                <div className="text-[10px]">{o.label}</div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep(1)}
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-semibold mt-4 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <Zap size={48} className="text-amber-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Upcoming events?</h2>
        <p className="text-white/50 text-center text-sm mb-6">
          Anything happening this week? Appointments, deadlines, plans?
        </p>

        <div className="w-full max-w-xs">
          <textarea
            value={events}
            onChange={(e) => setEvents(e.target.value)}
            placeholder="e.g. Dentist Tuesday 2pm, homework due Friday..."
            rows={3}
            className="w-full bg-white/5 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/20 border border-white/5 outline-none resize-none"
          />

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setStep(0)}
              className="flex-1 h-14 bg-white/5 hover:bg-white/10 rounded-2xl text-white/60 font-medium transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(2)}
              className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-semibold transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <Sparkles size={48} className="text-teal-400 mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">Anything different?</h2>
      <p className="text-white/50 text-center text-sm mb-6">
        Schedule changes, new priorities, something on your mind?
      </p>

      <div className="w-full max-w-xs">
        <textarea
          value={changes}
          onChange={(e) => setChanges(e.target.value)}
          placeholder="Optional — skip if nothing comes to mind"
          rows={3}
          className="w-full bg-white/5 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/20 border border-white/5 outline-none resize-none"
        />

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setStep(1)}
            className="flex-1 h-14 bg-white/5 hover:bg-white/10 rounded-2xl text-white/60 font-medium transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleFinish}
            disabled={upsertCheckin.isPending}
            className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-2xl text-white font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
