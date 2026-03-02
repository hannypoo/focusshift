import type { ProductivityZone } from '../types/database';

const TIME_SLOTS = [
  { label: 'Early Morning', start: '06:00', end: '09:00' },
  { label: 'Morning', start: '09:00', end: '12:00' },
  { label: 'Midday', start: '12:00', end: '14:00' },
  { label: 'Afternoon', start: '14:00', end: '17:00' },
  { label: 'Evening', start: '17:00', end: '20:00' },
  { label: 'Night', start: '20:00', end: '23:00' },
];

const ZONE_TYPES: { value: ProductivityZone['zone_type']; label: string; color: string; emoji: string }[] = [
  { value: 'peak', label: 'Peak', color: 'bg-green-500/20 text-green-400 border-green-500/40', emoji: '⚡' },
  { value: 'low', label: 'Low', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40', emoji: '🌙' },
  { value: 'dead', label: 'Dead', color: 'bg-red-500/20 text-red-400 border-red-500/40', emoji: '💤' },
];

interface ProductivityZoneSetupProps {
  zones: ProductivityZone[];
  onChange: (zones: ProductivityZone[]) => void;
}

export default function ProductivityZoneSetup({ zones, onChange }: ProductivityZoneSetupProps) {
  const getZoneForSlot = (start: string): ProductivityZone['zone_type'] | null => {
    const zone = zones.find((z) => z.start_time === start);
    return zone?.zone_type ?? null;
  };

  const setZoneForSlot = (start: string, end: string, zoneType: ProductivityZone['zone_type'] | null) => {
    const filtered = zones.filter((z) => z.start_time !== start);
    if (zoneType) {
      filtered.push({ start_time: start, end_time: end, zone_type: zoneType });
    }
    onChange(filtered);
  };

  return (
    <div className="space-y-4">
      <p className="text-white/50 text-sm text-center">
        When are you most productive? We'll schedule harder tasks during peak times.
      </p>

      <div className="space-y-2">
        {TIME_SLOTS.map(({ label, start, end }) => {
          const currentZone = getZoneForSlot(start);
          return (
            <div key={start} className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-xs text-white/40 mb-2">{label} ({start}–{end})</p>
              <div className="flex gap-2">
                {ZONE_TYPES.map(({ value, label: zLabel, color, emoji }) => (
                  <button
                    key={value}
                    onClick={() => setZoneForSlot(start, end, currentZone === value ? null : value)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all min-h-[44px] ${
                      currentZone === value
                        ? `${color} scale-[1.02]`
                        : 'bg-white/5 text-white/30 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {emoji} {zLabel}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-white/20 text-center">
        Leave blank if you're not sure — FocusShift will learn your patterns over time.
      </p>
    </div>
  );
}
