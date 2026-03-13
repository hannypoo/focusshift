import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface NominatimResult {
  display_name: string;
  place_id: string;
  type: string;
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    building?: string;
    amenity?: string;
  };
}

interface Suggestion {
  label: string;
  value: string;
  place_id: string;
}

/**
 * Build a clean address from Nominatim's structured response.
 * If the user typed a house number but Nominatim only matched the street,
 * prepend the user's number so the result still feels right.
 */
function formatAddress(item: NominatimResult, userQuery: string): { label: string; value: string } {
  const a = item.address;
  if (!a) return { label: item.display_name, value: item.display_name };

  // Extract user's house number from the beginning of their query
  const userNumMatch = userQuery.match(/^(\d+)\s/);
  const userHouseNum = userNumMatch?.[1];

  const houseNum = a.house_number || userHouseNum || '';
  const road = a.road || '';
  const city = a.city || a.town || a.village || a.county || '';
  const state = a.state || '';
  const zip = a.postcode || '';

  // Build the address
  const street = [houseNum, road].filter(Boolean).join(' ');
  const cityStateZip = [city, [state, zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');

  const full = [street, cityStateZip].filter(Boolean).join(', ');

  // Label shows building/amenity name if present
  const name = a.amenity || a.building;
  const label = name ? `${name}, ${full}` : full;

  return { label, value: full || item.display_name };
}

export default function AddressAutocomplete({ value, onChange, placeholder = 'Address' }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastQueryRef = useRef('');

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const search = useCallback(async (query: string) => {
    if (query.length < 4) {
      setSuggestions([]);
      return;
    }

    lastQueryRef.current = query;
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&addressdetails=1&limit=5&countrycodes=us` +
        `&q=${encodeURIComponent(query)}`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (!res.ok) throw new Error('Search failed');
      const data: NominatimResult[] = await res.json();

      // Deduplicate by formatted value
      const seen = new Set<string>();
      const results: Suggestion[] = [];
      for (const item of data) {
        const { label, value } = formatAddress(item, query);
        if (!seen.has(value)) {
          seen.add(value);
          results.push({ label, value, place_id: String(item.place_id) });
        }
      }

      setSuggestions(results);
      setShowDropdown(results.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (text: string) => {
    onChange(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(text), 400);
  };

  const handleSelect = (suggestion: Suggestion) => {
    onChange(suggestion.value);
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
          placeholder={placeholder}
          className="w-full h-12 bg-white/5 rounded-xl px-4 pr-10 text-sm text-white placeholder:text-white/20 border border-white/5 outline-none focus:border-indigo-500/40"
          autoComplete="off"
        />
        {loading ? (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 animate-spin" />
        ) : (
          <MapPin size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/15" />
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-xl shadow-black/30">
          {suggestions.map((s) => (
            <button
              key={s.place_id}
              onClick={() => handleSelect(s)}
              className="w-full text-left px-4 py-3 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors border-b border-white/5 last:border-0 flex items-start gap-2"
            >
              <MapPin size={12} className="text-indigo-400 mt-0.5 shrink-0" />
              <span className="line-clamp-2">{s.label}</span>
            </button>
          ))}
          <div className="px-3 py-2 text-[10px] text-amber-400/40 border-t border-white/5">
            Autocomplete may be inaccurate — double-check or type manually
          </div>
        </div>
      )}
    </div>
  );
}
