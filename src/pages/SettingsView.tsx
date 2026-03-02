import { useState, useEffect } from 'react';
import { Clock, Sparkles, Download, Upload, UtensilsCrossed, Heart, Zap, Gift, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import { useAuth } from '../context/AuthContext';
import TreatsQuiz from '../components/TreatsQuiz';
import ProductivityZoneSetup from '../components/ProductivityZoneSetup';
import type { ProductivityZone, MealTimes } from '../types/database';

export default function SettingsView() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { signOut } = useAuth();

  const [wakeTime, setWakeTime] = useState('09:00');
  const [windDown, setWindDown] = useState('22:00');
  const [transition, setTransition] = useState('5');
  const [buffer, setBuffer] = useState('10');
  const [wakeBuffer, setWakeBuffer] = useState('15');
  const [windDownBuffer, setWindDownBuffer] = useState('30');
  const [choreMinutes, setChoreMinutes] = useState('30');
  const [choreTime, setChoreTime] = useState('14:00');

  // Sync state from profile when it loads
  useEffect(() => {
    if (profile) {
      setWakeTime(profile.default_wake_time?.substring(0, 5) || '09:00');
      setWindDown(profile.default_wind_down_time?.substring(0, 5) || '22:00');
      setTransition(String(profile.transition_minutes ?? 5));
      setBuffer(String(profile.adhd_buffer_minutes ?? 10));
      setWakeBuffer(String(profile.wake_buffer_minutes ?? 15));
      setWindDownBuffer(String(profile.wind_down_buffer_minutes ?? 30));
      setChoreMinutes(String(profile.chore_block_minutes ?? 30));
      setChoreTime(profile.chore_block_time?.substring(0, 5) || '14:00');
    }
  }, [profile]);

  const handleSaveSchedule = async () => {
    await updateProfile.mutateAsync({
      default_wake_time: wakeTime,
      default_wind_down_time: windDown,
      transition_minutes: parseInt(transition) || 5,
      adhd_buffer_minutes: parseInt(buffer) || 10,
      wake_buffer_minutes: parseInt(wakeBuffer) || 15,
      wind_down_buffer_minutes: parseInt(windDownBuffer) || 30,
      chore_block_minutes: parseInt(choreMinutes) || 30,
      chore_block_time: choreTime,
    });
    toast.success('Schedule settings saved');
  };

  const handleSaveZones = async (zones: ProductivityZone[]) => {
    await updateProfile.mutateAsync({ productivity_zones: zones });
    toast.success('Productivity zones updated');
  };

  const handleSaveMeals = async (meals: MealTimes) => {
    await updateProfile.mutateAsync({ meal_times: meals });
    toast.success('Meal times updated');
  };

  const handleSaveTreats = async (treats: string[]) => {
    await updateProfile.mutateAsync({ treats });
    toast.success('Treats updated');
  };

  const toggleConfetti = () => updateProfile.mutate({ enable_confetti: !profile?.enable_confetti });
  const toggleSound = () => updateProfile.mutate({ enable_sound: !profile?.enable_sound });
  const toggleSelfCare = () => updateProfile.mutate({ self_care_auto: !profile?.self_care_auto });
  const toggleMultitask = () => updateProfile.mutate({ multitask_enabled: !profile?.multitask_enabled });
  const toggleMealReminders = () => updateProfile.mutate({ meal_reminders: !profile?.meal_reminders });
  const toggleWaterReminders = () => updateProfile.mutate({ water_reminders: !profile?.water_reminders });

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-white">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-6">
        {/* Schedule */}
        <Section icon={Clock} title="Schedule">
          <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-4">
            <TimeInput label="Wake time" value={wakeTime} onChange={setWakeTime} />
            <TimeInput label="Wind-down time" value={windDown} onChange={setWindDown} />
            <NumberInput label="Transition buffer" value={transition} onChange={setTransition} unit="min" />
            <NumberInput label="ADHD buffer (travel)" value={buffer} onChange={setBuffer} unit="min" />
            <NumberInput label="Morning buffer" value={wakeBuffer} onChange={setWakeBuffer} unit="min" />
            <NumberInput label="Wind-down buffer" value={windDownBuffer} onChange={setWindDownBuffer} unit="min" />
            <div className="border-t border-white/5 pt-4 space-y-4">
              <TimeInput label="Chore block time" value={choreTime} onChange={setChoreTime} />
              <NumberInput label="Chore block length" value={choreMinutes} onChange={setChoreMinutes} unit="min" />
            </div>
            <button onClick={handleSaveSchedule}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white transition-colors">
              Save Schedule Settings
            </button>
          </div>
        </Section>

        {/* Productivity Zones */}
        <Section icon={Zap} title="Productivity Zones">
          <ProductivityZoneSetup
            zones={profile?.productivity_zones || []}
            onChange={handleSaveZones}
          />
        </Section>

        {/* Meals */}
        <Section icon={UtensilsCrossed} title="Meals">
          <MealSettings meals={profile?.meal_times} onSave={handleSaveMeals} />
          <div className="mt-3 bg-white/5 rounded-xl border border-white/5 overflow-hidden">
            <ToggleRow label="Meal reminders" description="Notification before mealtimes"
              enabled={profile?.meal_reminders ?? true} onToggle={toggleMealReminders} />
            <ToggleRow label="Water reminders" description="Hourly hydration nudges"
              enabled={profile?.water_reminders ?? false} onToggle={toggleWaterReminders} />
          </div>
        </Section>

        {/* Self-Care */}
        <Section icon={Heart} title="Self-Care">
          <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
            <ToggleRow label="Auto self-care blocks" description="Morning + evening routine (teeth-brushing, etc.)"
              enabled={profile?.self_care_auto ?? true} onToggle={toggleSelfCare} />
            <ToggleRow label="Multi-tasking mode" description="Show tasks you can do during travel/waiting"
              enabled={profile?.multitask_enabled ?? false} onToggle={toggleMultitask} />
          </div>
        </Section>

        {/* Treats */}
        <Section icon={Gift} title="Treats & Rewards">
          <TreatsQuiz selected={profile?.treats || []} onChange={handleSaveTreats} />
        </Section>

        {/* Preferences */}
        <Section icon={Sparkles} title="Preferences">
          <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
            <ToggleRow label="Celebration confetti" description="Confetti burst on task completion"
              enabled={profile?.enable_confetti ?? true} onToggle={toggleConfetti} />
            <ToggleRow label="Sound effects" description="Audio feedback on interactions"
              enabled={profile?.enable_sound ?? false} onToggle={toggleSound} />
          </div>
        </Section>

        {/* Data */}
        <Section icon={Download} title="Data">
          <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
            <button onClick={() => toast.info('Data export coming soon')}
              className="w-full flex items-center gap-3 px-4 py-4 text-white/60 hover:text-white hover:bg-white/5 transition-colors">
              <Download size={18} /><span className="text-sm">Export data</span>
            </button>
            <button onClick={() => toast.info('Data import coming soon')}
              className="w-full flex items-center gap-3 px-4 py-4 text-white/60 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5">
              <Upload size={18} /><span className="text-sm">Import data</span>
            </button>
          </div>
        </Section>

        {/* Account */}
        <Section icon={LogOut} title="Account">
          <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
            <button onClick={() => { signOut(); toast.success('Signed out'); }}
              className="w-full flex items-center gap-3 px-4 py-4 text-white/60 hover:text-red-400 hover:bg-white/5 transition-colors">
              <LogOut size={18} /><span className="text-sm">Sign out</span>
            </button>
          </div>
        </Section>

        <p className="text-center text-[10px] text-white/15 py-4">FocusShift v2.0 · Made with focus</p>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-indigo-400" />
        <h2 className="text-sm font-semibold text-white/60">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function MealSettings({ meals, onSave }: { meals?: MealTimes; onSave: (m: MealTimes) => void }) {
  const defaults: MealTimes = {
    breakfast: { time: '08:00', enabled: true },
    lunch: { time: '12:00', enabled: true },
    dinner: { time: '18:00', enabled: true },
  };
  const m = meals || defaults;

  const toggle = (meal: keyof MealTimes) => {
    onSave({ ...m, [meal]: { ...m[meal], enabled: !m[meal].enabled } });
  };

  const setTime = (meal: keyof MealTimes, time: string) => {
    onSave({ ...m, [meal]: { ...m[meal], time } });
  };

  return (
    <div className="space-y-2">
      {(['breakfast', 'lunch', 'dinner'] as const).map((meal) => (
        <div key={meal} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
          <button onClick={() => toggle(meal)}
            className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${m[meal].enabled ? 'bg-indigo-600' : 'bg-white/10'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${m[meal].enabled ? 'translate-x-5' : ''}`} />
          </button>
          <span className="flex-1 text-sm text-white capitalize">{meal}</span>
          <input type="time" value={m[meal].time} onChange={(e) => setTime(meal, e.target.value)}
            disabled={!m[meal].enabled}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none disabled:opacity-30" />
        </div>
      ))}
    </div>
  );
}

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-white/60">{label}</label>
      <input type="time" value={value} onChange={(e) => onChange(e.target.value)}
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" />
    </div>
  );
}

function NumberInput({ label, value, onChange, unit }: { label: string; value: string; onChange: (v: string) => void; unit: string }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-white/60">{label}</label>
      <div className="flex items-center gap-2">
        <input type="number" value={value} onChange={(e) => onChange(e.target.value)} min="0" max="60"
          className="w-16 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white text-center outline-none" />
        <span className="text-xs text-white/30">{unit}</span>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, enabled, onToggle }: { label: string; description: string; enabled: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-4 hover:bg-white/5 transition-colors">
      <div className="flex-1 text-left">
        <p className="text-sm text-white">{label}</p>
        <p className="text-[11px] text-white/30">{description}</p>
      </div>
      <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${enabled ? 'bg-indigo-600' : 'bg-white/10'}`}>
        <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : ''}`} />
      </div>
    </button>
  );
}
