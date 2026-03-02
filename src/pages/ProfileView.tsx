import { useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useCategories, useUpdateCategory } from '../hooks/useCategories';
import { useGoals, useCreateGoal } from '../hooks/useGoals';
import { useLocations, useCreateLocation, useDeleteLocation } from '../hooks/useLocations';
import { getCategoryColors } from '../lib/utils';
import { getWeekStart } from '../lib/dateUtils';
import { useProfileId } from '../hooks/useProfileId';
import { MapPin, Target, Layers, Plus, Trash2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import type { Category } from '../types';
import type { DbCategory } from '../types/database';

type Section = 'main' | 'categories' | 'goals' | 'locations';

export default function ProfileView() {
  const [section, setSection] = useState<Section>('main');
  const { data: profile } = useProfile();
  const { data: categories } = useCategories();
  const { data: goals } = useGoals();
  const { data: locations } = useLocations();

  if (section === 'categories') return <CategoryEditor categories={categories || []} onBack={() => setSection('main')} />;
  if (section === 'goals') return <GoalsEditor goals={goals || []} categories={categories || []} onBack={() => setSection('main')} />;
  if (section === 'locations') return <LocationsEditor locations={locations || []} onBack={() => setSection('main')} />;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-white">Profile</h1>
        <p className="text-sm text-white/40">{profile?.display_name || 'User'}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-2">
        <NavItem icon={Layers} label="Categories" count={categories?.filter((c) => c.enabled).length} onClick={() => setSection('categories')} />
        <NavItem icon={Target} label="Weekly Goals" count={goals?.filter((g) => g.is_active).length} onClick={() => setSection('goals')} />
        <NavItem icon={MapPin} label="Locations" count={locations?.length} onClick={() => setSection('locations')} />
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, count, onClick }: { icon: typeof Layers; label: string; count?: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-4 rounded-xl bg-white/5 hover:bg-white/8 border border-white/5 transition-colors">
      <Icon size={20} className="text-indigo-400" />
      <span className="flex-1 text-sm font-medium text-white text-left">{label}</span>
      {count !== undefined && <span className="text-xs text-white/30">{count}</span>}
      <ChevronRight size={16} className="text-white/20" />
    </button>
  );
}

function CategoryEditor({ categories, onBack }: { categories: Category[]; onBack: () => void }) {
  const updateCategory = useUpdateCategory();

  const toggleCategory = (id: string, enabled: boolean) => {
    updateCategory.mutate({ id, enabled } as { id: string } & Partial<DbCategory>);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={onBack} className="text-white/50 hover:text-white text-sm">&larr; Back</button>
        <h1 className="text-lg font-bold text-white">Categories</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-2">
        {categories.map((cat) => {
          const colors = getCategoryColors(cat.color);
          return (
            <div key={cat.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
              cat.enabled ? `${colors.bgLight} ${colors.border}/30` : 'bg-white/3 border-white/5 opacity-50'
            }`}>
              <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{cat.name}</p>
                <p className="text-[10px] text-white/30">
                  P{cat.priority} · {cat.defaultBlockMinutes}min · {cat.weeklyMinMinutes ? `${cat.weeklyMinMinutes}m/wk` : 'no target'}
                </p>
              </div>
              <button
                onClick={() => toggleCategory(cat.id, !cat.enabled)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  cat.enabled ? 'bg-white/10 text-white/60' : 'bg-indigo-500/20 text-indigo-400'
                }`}
              >
                {cat.enabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GoalsEditor({ goals, categories, onBack }: { goals: { id: string; title: string; target_count: number | null; current_count: number; category_id: string | null }[]; categories: Category[]; onBack: () => void }) {
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('2');
  const [catId] = useState(categories[0]?.id || '');
  const createGoal = useCreateGoal();

  const profileId = useProfileId();

  const handleAdd = async () => {
    if (!title.trim()) return;
    await createGoal.mutateAsync({
      profile_id: profileId,
      category_id: catId || null,
      title: title.trim(),
      target_count: parseInt(target) || 2,
      target_minutes: null,
      current_count: 0,
      current_minutes: 0,
      week_start: getWeekStart(),
      is_active: true,
    });
    setTitle('');
    toast.success('Goal added');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={onBack} className="text-white/50 hover:text-white text-sm">&larr; Back</button>
        <h1 className="text-lg font-bold text-white">Weekly Goals</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-4">
        {/* Existing goals */}
        {goals.map((g) => (
          <div key={g.id} className="bg-white/5 rounded-xl px-4 py-3 border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white font-medium">{g.title}</span>
              <span className="text-xs text-white/40">{g.current_count}/{g.target_count ?? '—'}</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${g.target_count ? Math.min((g.current_count / g.target_count) * 100, 100) : 0}%` }}
              />
            </div>
          </div>
        ))}

        {/* Add goal */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
          <h3 className="text-sm font-medium text-white/60">Add Goal</h3>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Shower 2x/week"
            className="w-full h-12 bg-white/5 rounded-xl px-4 text-sm text-white placeholder:text-white/20 border border-white/5 outline-none"
          />
          <div className="flex gap-2">
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              type="number"
              min="1"
              className="w-20 h-12 bg-white/5 rounded-xl px-3 text-sm text-white border border-white/5 outline-none text-center"
            />
            <span className="self-center text-xs text-white/30">times/week</span>
          </div>
          <button onClick={handleAdd} className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-colors">
            <Plus size={16} /> Add Goal
          </button>
        </div>
      </div>
    </div>
  );
}

function LocationsEditor({ locations, onBack }: { locations: { id: string; name: string; address: string | null; is_home: boolean }[]; onBack: () => void }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const createLocation = useCreateLocation();
  const deleteLocation = useDeleteLocation();

  const handleAdd = async () => {
    if (!name.trim()) return;
    await createLocation.mutateAsync({ name: name.trim(), address: address.trim() || undefined });
    setName('');
    setAddress('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={onBack} className="text-white/50 hover:text-white text-sm">&larr; Back</button>
        <h1 className="text-lg font-bold text-white">Locations</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-3">
        {locations.map((loc) => (
          <div key={loc.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5">
            <MapPin size={16} className="text-indigo-400" />
            <div className="flex-1">
              <p className="text-sm text-white font-medium">{loc.name} {loc.is_home && <span className="text-[10px] text-white/30">(home)</span>}</p>
              {loc.address && <p className="text-[10px] text-white/30">{loc.address}</p>}
            </div>
            {!loc.is_home && (
              <button onClick={() => deleteLocation.mutate(loc.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/20 hover:text-red-400">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}

        <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Location name"
            className="w-full h-12 bg-white/5 rounded-xl px-4 text-sm text-white placeholder:text-white/20 border border-white/5 outline-none"
          />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address (optional)"
            className="w-full h-12 bg-white/5 rounded-xl px-4 text-sm text-white placeholder:text-white/20 border border-white/5 outline-none"
          />
          <button onClick={handleAdd} className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-colors">
            <Plus size={16} /> Add Location
          </button>
        </div>
      </div>
    </div>
  );
}
