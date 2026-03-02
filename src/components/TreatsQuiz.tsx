import { Check, Coffee, Cookie, Phone, TreePine, Music, Gamepad2, StretchHorizontal, Plus } from 'lucide-react';
import { useState } from 'react';

const TREAT_OPTIONS = [
  { id: 'coffee', label: 'Coffee / Tea', icon: Coffee },
  { id: 'snack', label: 'Snack Break', icon: Cookie },
  { id: 'phone', label: 'Phone Break', icon: Phone },
  { id: 'walk', label: 'Short Walk', icon: TreePine },
  { id: 'music', label: 'Fave Song', icon: Music },
  { id: 'game', label: 'Quick Game', icon: Gamepad2 },
  { id: 'stretch', label: 'Stretch', icon: StretchHorizontal },
];

interface TreatsQuizProps {
  selected: string[];
  onChange: (treats: string[]) => void;
}

export default function TreatsQuiz({ selected, onChange }: TreatsQuizProps) {
  const [custom, setCustom] = useState('');

  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter((t) => t !== id)
        : [...selected, id]
    );
  };

  const addCustom = () => {
    const trimmed = custom.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
      setCustom('');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-white/50 text-sm text-center">
        Pick your favorite rewards — we'll suggest them when you complete tasks!
      </p>

      <div className="grid grid-cols-2 gap-3">
        {TREAT_OPTIONS.map(({ id, label, icon: Icon }) => {
          const isSelected = selected.includes(id);
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-medium transition-all min-h-[56px] ${
                isSelected
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 scale-[1.02]'
                  : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/10'
              }`}
            >
              <Icon size={20} />
              <span className="flex-1 text-left">{label}</span>
              {isSelected && <Check size={14} />}
            </button>
          );
        })}
      </div>

      {/* Custom treat */}
      <div className="flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCustom()}
          placeholder="Add your own..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none"
        />
        <button
          onClick={addCustom}
          disabled={!custom.trim()}
          className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 disabled:opacity-30 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Custom items shown */}
      {selected.filter((t) => !TREAT_OPTIONS.some((o) => o.id === t)).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.filter((t) => !TREAT_OPTIONS.some((o) => o.id === t)).map((t) => (
            <button
              key={t}
              onClick={() => toggle(t)}
              className="px-3 py-2 rounded-xl text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/40"
            >
              {t} ×
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
