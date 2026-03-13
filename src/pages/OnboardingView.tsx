import { useState } from 'react';
import {
  Sparkles, Clock, Zap, UtensilsCrossed, Heart,
  MapPin, CalendarClock, Target, Gift, Rocket,
  ChevronRight, ChevronLeft, Check,
} from 'lucide-react';
import { useUpdateProfile } from '../hooks/useProfile';
import { useCreateLocation } from '../hooks/useLocations';
import { useCreateGoal } from '../hooks/useGoals';
import { useCreateRecurringTask } from '../hooks/useRecurringTasks';
import { useProfileId } from '../hooks/useProfileId';
import { getWeekStart } from '../lib/dateUtils';
import { supabase } from '../lib/supabase';
import { DEFAULT_CATEGORIES } from '../data/categories';
import { toast } from 'sonner';
import TreatsQuiz from '../components/TreatsQuiz';
import ProductivityZoneSetup from '../components/ProductivityZoneSetup';
import type { ProductivityZone, MealTimes } from '../types/database';

interface OnboardingViewProps {
  onComplete: () => void;
}

const STEPS = [
  { icon: Sparkles, title: 'Welcome', subtitle: "Let's set up Offload for you" },
  { icon: Clock, title: 'Schedule', subtitle: 'When does your day start and end?' },
  { icon: Zap, title: 'Energy Zones', subtitle: 'When are you most productive?' },
  { icon: UtensilsCrossed, title: 'Meals', subtitle: 'Protect your mealtimes' },
  { icon: Heart, title: 'Self-Care', subtitle: 'Automatic self-care reminders' },
  { icon: MapPin, title: 'Places', subtitle: 'Where do you spend your time?' },
  { icon: CalendarClock, title: 'Recurring', subtitle: 'Regular weekly commitments' },
  { icon: Target, title: 'Goals', subtitle: 'What do you want to track?' },
  { icon: Gift, title: 'Treats', subtitle: 'What makes you feel rewarded?' },
  { icon: Rocket, title: 'Ready!', subtitle: "You're all set!" },
];

const COMMON_LOCATIONS = ['School', 'Work', 'Gym', "Son's place", 'Grocery store', 'Library'];
const COMMON_GOALS = [
  'Shower 2x/week', 'See son 3x/week', 'Exercise 3x/week',
  'Clean 2x/week', 'Apply to 5 jobs/week', 'Cook a meal 2x/week',
];
const COMMON_RECURRING = [
  { title: 'Class', days: [1, 3, 5], time: '10:00', duration: 90 },
  { title: 'Therapy', days: [2], time: '14:00', duration: 60 },
  { title: 'Weekly team meeting', days: [1], time: '09:00', duration: 60 },
  { title: 'Church/worship', days: [0], time: '10:00', duration: 90 },
  { title: 'Study group', days: [4], time: '16:00', duration: 60 },
];

const DEFAULT_MEALS: MealTimes = {
  breakfast: { time: '08:00', enabled: true },
  lunch: { time: '12:00', enabled: true },
  dinner: { time: '18:00', enabled: true },
};

export default function OnboardingView({ onComplete }: OnboardingViewProps) {
  const profileId = useProfileId();
  const [step, setStep] = useState(0);

  // Step 0: Welcome
  const [name, setName] = useState('');

  // Step 1: Schedule
  const [wakeTime, setWakeTime] = useState('09:00');
  const [windDown, setWindDown] = useState('22:00');
  const [wakeBuffer, setWakeBuffer] = useState(15);
  const [windDownBuffer, setWindDownBuffer] = useState(30);

  // Step 2: Energy zones
  const [zones, setZones] = useState<ProductivityZone[]>([]);

  // Step 3: Meals
  const [meals, setMeals] = useState<MealTimes>(DEFAULT_MEALS);

  // Step 4: Self-care
  const [selfCareAuto, setSelfCareAuto] = useState(true);

  // Step 5: Locations
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  // Step 6: Recurring events
  const [selectedRecurring, setSelectedRecurring] = useState<number[]>([]);

  // Step 7: Goals
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  // Step 8: Treats
  const [treats, setTreats] = useState<string[]>([]);

  const updateProfile = useUpdateProfile();
  const createLocation = useCreateLocation();
  const createGoal = useCreateGoal();
  const createRecurring = useCreateRecurringTask();

  const toggleLocation = (loc: string) =>
    setSelectedLocations((prev) => prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]);

  const toggleGoal = (goal: string) =>
    setSelectedGoals((prev) => prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]);

  const toggleRecurring = (idx: number) =>
    setSelectedRecurring((prev) => prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]);

  const toggleMeal = (meal: keyof MealTimes) =>
    setMeals((prev) => ({ ...prev, [meal]: { ...prev[meal], enabled: !prev[meal].enabled } }));

  const setMealTime = (meal: keyof MealTimes, time: string) =>
    setMeals((prev) => ({ ...prev, [meal]: { ...prev[meal], time } }));

  const handleFinish = async () => {
    if (!profileId) return;
    // Save profile with all v2 fields
    await updateProfile.mutateAsync({
      display_name: name.trim() || 'User',
      default_wake_time: wakeTime,
      default_wind_down_time: windDown,
      wake_buffer_minutes: wakeBuffer,
      wind_down_buffer_minutes: windDownBuffer,
      productivity_zones: zones,
      meal_times: meals,
      self_care_auto: selfCareAuto,
      treats,
      onboarding_version: 2,
    });

    // Seed default categories for new user
    const categoryRows = DEFAULT_CATEGORIES.map((cat) => ({
      id: cat.id,
      profile_id: profileId,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      priority: cat.priority,
      default_block_minutes: cat.defaultBlockMinutes,
      weekly_min_minutes: cat.weeklyMinMinutes,
      is_protected: cat.isProtected,
      is_fixed: cat.isFixed,
      enabled: cat.enabled,
    }));
    await supabase.from('categories').upsert(categoryRows, { onConflict: 'id' });

    // Save locations
    for (const loc of selectedLocations) {
      await createLocation.mutateAsync({ name: loc });
    }

    // Save recurring events
    for (const idx of selectedRecurring) {
      const r = COMMON_RECURRING[idx];
      await createRecurring.mutateAsync({
        profile_id: profileId,
        title: r.title,
        task_type: 'appointment',
        category_id: null,
        frequency: 'weekly',
        days_of_week: r.days,
        times_per_week: null,
        estimated_minutes: r.duration,
        location_id: null,
        start_time: r.time,
        end_time: minutesAfter(r.time, r.duration),
        enabled: true,
      });
    }

    // Save goals
    for (const goal of selectedGoals) {
      const match = goal.match(/(\d+)x\/week/);
      await createGoal.mutateAsync({
        profile_id: profileId,
        category_id: null,
        title: goal,
        target_count: match ? parseInt(match[1]) : 2,
        target_minutes: null,
        current_count: 0,
        current_minutes: 0,
        week_start: getWeekStart(),
        is_active: true,
      });
    }

    toast.success('Setup complete!');
    onComplete();
  };

  const StepIcon = STEPS[step].icon;

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Progress */}
      <div className="flex gap-0.5 px-6 pt-6">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-colors ${
              i <= step ? 'bg-indigo-500' : 'bg-white/5'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center px-6 pt-8 pb-4">
        <StepIcon size={40} className="text-indigo-400 mb-3" />
        <h2 className="text-2xl font-bold text-white mb-1">{STEPS[step].title}</h2>
        <p className="text-white/50 text-center mb-6">{STEPS[step].subtitle}</p>

        <div className="w-full max-w-sm space-y-4">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should I call you?"
                className="w-full h-14 bg-white/5 rounded-2xl px-4 text-white placeholder:text-white/25 border border-white/10 outline-none text-base text-center"
                autoFocus
              />
              <p className="text-[11px] text-white/20 text-center">You can skip anything — come back later in Settings.</p>
            </>
          )}

          {/* Step 1: Schedule */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-white/60">Wake time</label>
                <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-white/60">Wind-down time</label>
                <input type="time" value={windDown} onChange={(e) => setWindDown(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-white/60">Morning buffer</label>
                <select value={wakeBuffer} onChange={(e) => setWakeBuffer(Number(e.target.value))}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none">
                  <option value={0}>None</option>
                  <option value={10}>10 min</option>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-white/60">Wind-down buffer</label>
                <select value={windDownBuffer} onChange={(e) => setWindDownBuffer(Number(e.target.value))}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none">
                  <option value={0}>None</option>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Energy Zones */}
          {step === 2 && <ProductivityZoneSetup zones={zones} onChange={setZones} />}

          {/* Step 3: Meals */}
          {step === 3 && (
            <div className="space-y-3">
              {(['breakfast', 'lunch', 'dinner'] as const).map((meal) => (
                <div key={meal} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
                  <button
                    onClick={() => toggleMeal(meal)}
                    className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${meals[meal].enabled ? 'bg-indigo-600' : 'bg-white/10'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${meals[meal].enabled ? 'translate-x-5' : ''}`} />
                  </button>
                  <span className="flex-1 text-sm text-white capitalize">{meal}</span>
                  <input
                    type="time"
                    value={meals[meal].time}
                    onChange={(e) => setMealTime(meal, e.target.value)}
                    disabled={!meals[meal].enabled}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none disabled:opacity-30"
                  />
                </div>
              ))}
              <p className="text-[11px] text-white/20 text-center">30-minute blocks will be reserved for meals.</p>
            </div>
          )}

          {/* Step 4: Self-Care */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelfCareAuto(!selfCareAuto)}
                    className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${selfCareAuto ? 'bg-indigo-600' : 'bg-white/10'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${selfCareAuto ? 'translate-x-5' : ''}`} />
                  </button>
                  <div>
                    <p className="text-sm text-white">Auto teeth-brushing reminders</p>
                    <p className="text-[11px] text-white/30">Morning + evening routine blocks</p>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-white/20 text-center">
                * Self-care blocks include basic hygiene. You can customize what's included in Settings.
              </p>
            </div>
          )}

          {/* Step 5: Locations */}
          {step === 5 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {COMMON_LOCATIONS.map((loc) => (
                <button key={loc} onClick={() => toggleLocation(loc)}
                  className={`px-4 py-3 rounded-2xl text-sm font-medium transition-colors min-h-[56px] ${
                    selectedLocations.includes(loc)
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                      : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/10'
                  }`}>
                  {selectedLocations.includes(loc) && <Check size={14} className="inline mr-1" />}
                  {loc}
                </button>
              ))}
            </div>
          )}

          {/* Step 6: Recurring Events */}
          {step === 6 && (
            <div className="space-y-2">
              {COMMON_RECURRING.map((r, idx) => (
                <button key={idx} onClick={() => toggleRecurring(idx)}
                  className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-sm transition-colors min-h-[56px] ${
                    selectedRecurring.includes(idx)
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                      : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/10'
                  }`}>
                  {selectedRecurring.includes(idx) ? <Check size={16} /> : <CalendarClock size={16} className="text-white/20" />}
                  <span className="flex-1 text-left">{r.title}</span>
                  <span className="text-[11px] text-white/25">{r.days.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}</span>
                </button>
              ))}
              <p className="text-[11px] text-white/20 text-center">Add more in Profile later.</p>
            </div>
          )}

          {/* Step 7: Goals */}
          {step === 7 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {COMMON_GOALS.map((goal) => (
                <button key={goal} onClick={() => toggleGoal(goal)}
                  className={`px-4 py-3 rounded-2xl text-sm font-medium transition-colors min-h-[56px] ${
                    selectedGoals.includes(goal)
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                      : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/10'
                  }`}>
                  {selectedGoals.includes(goal) && <Check size={14} className="inline mr-1" />}
                  {goal}
                </button>
              ))}
            </div>
          )}

          {/* Step 8: Treats Quiz */}
          {step === 8 && <TreatsQuiz selected={treats} onChange={setTreats} />}

          {/* Step 9: Ready */}
          {step === 9 && (
            <div className="text-center space-y-3">
              <p className="text-white/50 text-sm">
                Offload will learn how long things actually take and improve your schedule over time.
              </p>
              <p className="text-white/30 text-xs">
                No pressure. Miss something? It just moves to tomorrow. No guilt.
              </p>
              <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-left space-y-2 mt-4">
                <SummaryRow label="Name" value={name || 'User'} />
                <SummaryRow label="Schedule" value={`${wakeTime} – ${windDown}`} />
                <SummaryRow label="Energy zones" value={`${zones.length} configured`} />
                <SummaryRow label="Meals" value={[meals.breakfast.enabled && 'B', meals.lunch.enabled && 'L', meals.dinner.enabled && 'D'].filter(Boolean).join(', ') || 'None'} />
                <SummaryRow label="Self-care" value={selfCareAuto ? 'Auto' : 'Off'} />
                <SummaryRow label="Locations" value={`${selectedLocations.length} places`} />
                <SummaryRow label="Treats" value={`${treats.length} picked`} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8 flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="h-14 px-6 bg-white/5 hover:bg-white/10 rounded-2xl text-white/60 font-medium transition-colors flex items-center gap-1"
          >
            <ChevronLeft size={16} />
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {step === 0 && !name.trim() ? 'Skip' : 'Next'}
            <ChevronRight size={18} />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-semibold transition-colors"
          >
            Let's go!
          </button>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-white/40">{label}</span>
      <span className="text-white/70">{value}</span>
    </div>
  );
}

function minutesAfter(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`;
}
