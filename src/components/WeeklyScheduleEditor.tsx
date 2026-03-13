import { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, MapPin, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  useRecurringTasks,
  useCreateRecurringTask,
  useUpdateRecurringTask,
  useDeleteRecurringTask,
} from '../hooks/useRecurringTasks';
import { useLocations } from '../hooks/useLocations';
import { useCategories } from '../hooks/useCategories';
import { useProfileId } from '../hooks/useProfileId';
import { formatTimeOfDay } from '../lib/utils';
import type { RecurringTask, TaskType } from '../types/database';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_EMOJI = ['☀️', '😤', '💪', '🐪', '🎉', '🥳', '😴'];

// Keyword → suggested type + category name matching
const TYPE_HINTS: { keywords: string[]; type: TaskType; categoryHints: string[] }[] = [
  { keywords: ['class', 'lecture', 'seminar', 'lab', 'msis', 'school', 'course'], type: 'appointment', categoryHints: ['class', 'appointment', 'school'] },
  { keywords: ['therapy', 'therapist', 'counseling', 'counselor', 'psychiatrist', 'psych'], type: 'appointment', categoryHints: ['self-care', 'appointment'] },
  { keywords: ['doctor', 'dentist', 'appointment', 'meeting', 'interview'], type: 'appointment', categoryHints: ['appointment', 'class'] },
  { keywords: ['son', 'daughter', 'kid', 'kiddo', 'child', 'baby', 'family', 'mom', 'dad', 'parent'], type: 'task', categoryHints: ['son', 'family'] },
  { keywords: ['visit', 'hang', 'hangout', 'friend', 'date', 'dinner with', 'lunch with'], type: 'task', categoryHints: ['son', 'family', 'social', 'networking'] },
  { keywords: ['gym', 'workout', 'exercise', 'run', 'yoga', 'swim', 'hike', 'walk'], type: 'self_care', categoryHints: ['self-care', 'exercise'] },
  { keywords: ['shower', 'bath', 'brush', 'skincare', 'meditat', 'journal'], type: 'self_care', categoryHints: ['self-care'] },
  { keywords: ['church', 'mosque', 'temple', 'worship', 'pray', 'spiritual', 'service', 'bible', 'quran'], type: 'self_care', categoryHints: ['self-care'] },
  { keywords: ['tv', 'netflix', 'game', 'gaming', 'puzzle', 'chill', 'relax', 'movie', 'show', 'read'], type: 'self_care', categoryHints: ['self-care'] },
  { keywords: ['grocery', 'store', 'shop', 'pick up', 'errand', 'mail', 'post office', 'bank'], type: 'errand', categoryHints: ['errand'] },
  { keywords: ['clean', 'laundry', 'dishes', 'vacuum', 'mop', 'trash', 'tidy'], type: 'task', categoryHints: ['cleaning', 'chore'] },
  { keywords: ['homework', 'study', 'assignment', 'paper', 'essay', 'reading', 'project'], type: 'task', categoryHints: ['homework', 'school'] },
  { keywords: ['work', 'job', 'shift', 'office'], type: 'appointment', categoryHints: ['work', 'job'] },
  { keywords: ['church', 'mosque', 'temple', 'worship', 'service'], type: 'appointment', categoryHints: ['appointment'] },
];

function suggestFromTitle(
  title: string,
  categories: { id: string; name: string }[]
): { type: TaskType | null; categoryId: string | null } {
  const lower = title.toLowerCase();
  if (lower.length < 2) return { type: null, categoryId: null };

  let bestType: TaskType | null = null;
  let bestCategoryId: string | null = null;

  for (const hint of TYPE_HINTS) {
    if (hint.keywords.some((kw) => lower.includes(kw))) {
      bestType = hint.type;
      // Try to match a category
      for (const catHint of hint.categoryHints) {
        const match = categories.find((c) =>
          c.name.toLowerCase().includes(catHint) || c.id.toLowerCase().includes(catHint)
        );
        if (match) { bestCategoryId = match.id; break; }
      }
      break;
    }
  }

  return { type: bestType, categoryId: bestCategoryId };
}

interface Props {
  onBack: () => void;
}

export default function WeeklyScheduleEditor({ onBack }: Props) {
  const profileId = useProfileId();
  const { data: tasks } = useRecurringTasks(false);
  const { data: locations } = useLocations();
  const { data: categories } = useCategories();
  const createTask = useCreateRecurringTask();
  const updateTask = useUpdateRecurringTask();
  const deleteTask = useDeleteRecurringTask();

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const grouped = groupByDay(tasks || []);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={onBack} className="text-white/50 hover:text-white text-sm">&larr; Back</button>
        <h1 className="text-lg font-bold text-white flex-1">Weekly Schedule</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-4">
        {/* Empty state */}
        {(!tasks || tasks.length === 0) && !showAdd && !editingId && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-white/40 text-sm">What does your week usually look like?</p>
            <p className="text-white/20 text-xs mt-1">Add classes, appointments, recurring hangouts — anything that happens regularly.</p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-5 px-6 h-12 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white inline-flex items-center gap-2 transition-colors"
            >
              <Plus size={16} /> Add Something
            </button>
          </div>
        )}

        {/* Add button when events exist */}
        {tasks && tasks.length > 0 && !showAdd && !editingId && (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full h-12 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20 rounded-xl text-sm font-medium text-indigo-400 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={16} /> Add Another
          </button>
        )}

        {/* Add flow */}
        {showAdd && (
          <StepByStepForm
            locations={locations || []}
            categories={categories || []}
            profileId={profileId}
            onSave={async (data) => {
              await createTask.mutateAsync(data as Omit<RecurringTask, 'id' | 'created_at'>);
              setShowAdd(false);
            }}
            onCancel={() => setShowAdd(false)}
          />
        )}

        {/* Edit flow */}
        {editingId && (() => {
          const rt = tasks?.find((t) => t.id === editingId);
          if (!rt) return null;
          return (
            <StepByStepForm
              existing={rt}
              locations={locations || []}
              categories={categories || []}
              profileId={profileId}
              onSave={async (data) => {
                await updateTask.mutateAsync({ id: rt.id, ...data });
                setEditingId(null);
                toast.success('Updated!');
              }}
              onCancel={() => setEditingId(null)}
              onDelete={async () => {
                await deleteTask.mutateAsync(rt.id);
                setEditingId(null);
              }}
            />
          );
        })()}

        {/* Event list (hidden during add/edit) */}
        {!showAdd && !editingId && DAY_LABELS.map((dayLabel, dayIndex) => {
          const dayTasks = grouped.get(dayIndex);
          if (!dayTasks || dayTasks.length === 0) return null;

          return (
            <div key={dayIndex}>
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">
                {DAY_EMOJI[dayIndex]} {dayLabel}
              </h3>
              <div className="space-y-2">
                {dayTasks.map((rt) => (
                  <EventCard
                    key={`${dayIndex}-${rt.id}`}
                    task={rt}
                    locationName={locations?.find((l) => l.id === rt.location_id)?.name}
                    onEdit={() => setEditingId(rt.id)}
                    onToggle={() => updateTask.mutate({ id: rt.id, enabled: !rt.enabled })}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────

function EventCard({
  task, locationName, onEdit, onToggle,
}: {
  task: RecurringTask;
  locationName?: string;
  onEdit: () => void;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onEdit}
      className={`w-full text-left rounded-xl px-4 py-3 border transition-colors ${
        task.enabled
          ? 'bg-white/5 border-white/5 hover:bg-white/8'
          : 'bg-white/2 border-white/3 opacity-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{task.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {task.estimated_minutes && task.estimated_minutes >= 480 ? (
              <span className="text-[10px] text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded">
                All day{task.times_per_week ? ` · ${task.times_per_week}x/week` : ''}
              </span>
            ) : task.times_per_week ? (
              <span className="text-[10px] text-indigo-400 bg-indigo-500/15 px-1.5 py-0.5 rounded">
                {task.times_per_week}x/week · {task.estimated_minutes}min
              </span>
            ) : task.is_flexible ? (
              <span className="text-[10px] text-indigo-400 bg-indigo-500/15 px-1.5 py-0.5 rounded">
                Flexible · {task.estimated_minutes}min
              </span>
            ) : task.start_time ? (
              <span className="text-[10px] text-white/40 flex items-center gap-0.5">
                <Clock size={9} /> {formatTimeOfDay(task.start_time)}
                {task.end_time && ` – ${formatTimeOfDay(task.end_time)}`}
              </span>
            ) : null}
            {locationName && (
              <span className="text-[10px] text-white/30 flex items-center gap-0.5">
                <MapPin size={9} /> {locationName}
              </span>
            )}
            {(task.not_before || task.not_after || task.notes) && (
              <span className="text-[10px] text-amber-400/60 flex items-center gap-0.5">
                <AlertCircle size={9} /> Restrictions
              </span>
            )}
          </div>
        </div>
        <div
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${
            task.enabled ? 'bg-indigo-600' : 'bg-white/10'
          }`}
        >
          <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
            task.enabled ? 'translate-x-5' : ''
          }`} />
        </div>
      </div>
    </button>
  );
}

// ─── Step-by-Step Form ────────────────────────────────────────────

type FormData = Omit<RecurringTask, 'id' | 'created_at'>;

const TOTAL_STEPS = 5;

function StepByStepForm({
  existing,
  locations,
  categories,
  profileId,
  onSave,
  onCancel,
  onDelete,
}: {
  existing?: RecurringTask;
  locations: { id: string; name: string; is_home: boolean }[];
  categories: { id: string; name: string; color: string; enabled: boolean }[];
  profileId: string | null;
  onSave: (data: FormData) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState(existing?.title || '');
  const [taskType, setTaskType] = useState<TaskType>(existing?.task_type || 'appointment');
  const [fixedDays, setFixedDays] = useState<boolean | null>(
    existing ? (existing.days_of_week && existing.days_of_week.length > 0 ? true : false) : null
  );
  const [days, setDays] = useState<number[]>(existing?.days_of_week || []);
  const [timesPerWeek, setTimesPerWeek] = useState(existing?.times_per_week || 1);
  const [isFlexible, setIsFlexible] = useState(existing?.is_flexible ?? false);
  const [timesVary, setTimesVary] = useState(false);
  const [startTime, setStartTime] = useState(existing?.start_time?.substring(0, 5) || '');
  const [endTime, setEndTime] = useState(existing?.end_time?.substring(0, 5) || '');
  const [perDayTimes, setPerDayTimes] = useState<Record<number, { start: string; end: string }>>(
    {} // keyed by day index, e.g. { 1: { start: '09:00', end: '11:30' }, 6: { start: '10:00', end: '14:00' } }
  );
  const [duration, setDuration] = useState(existing?.estimated_minutes || 60);
  const [locationId, setLocationId] = useState<string | null>(existing?.location_id || null);
  const [categoryId, setCategoryId] = useState<string | null>(existing?.category_id || null);
  const [isAllDay, setIsAllDay] = useState(existing?.estimated_minutes ? existing.estimated_minutes >= 480 : false);
  const [customDuration, setCustomDuration] = useState('');
  const [notBefore, setNotBefore] = useState(existing?.not_before?.substring(0, 5) || '');
  const [notAfter, setNotAfter] = useState(existing?.not_after?.substring(0, 5) || '');
  const [notes, setNotes] = useState(existing?.notes || '');

  const [userOverrodeType, setUserOverrodeType] = useState(!!existing);
  const [userOverrodeCat, setUserOverrodeCat] = useState(!!existing);

  // Auto-suggest type + category as user types
  useEffect(() => {
    if (existing) return; // Don't override when editing
    const { type, categoryId: suggestedCatId } = suggestFromTitle(title, categories);
    if (type && !userOverrodeType) setTaskType(type);
    if (suggestedCatId && !userOverrodeCat) setCategoryId(suggestedCatId);
  }, [title, categories, existing, userOverrodeType, userOverrodeCat]);

  const toggleDay = (d: number) => {
    setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort());
  };

  const canAdvance = (): boolean => {
    switch (step) {
      case 1: return title.trim().length > 0;
      case 2: return fixedDays === false || (fixedDays === true && days.length > 0);
      case 3: {
        if (fixedDays === false) return true;
        if (isFlexible) return true;
        if (timesVary) return days.every((d) => perDayTimes[d]?.start);
        return !!startTime;
      }
      case 4: return true; // location is optional
      case 5: return true; // restrictions are optional
      default: return true;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      // If days vary, skip the fixed/flexible time question (always flexible)
      // but still show duration on step 3
      setStep(step + 1);
    } else {
      handleSave();
    }
  };

  const handleSave = async () => {
    if (!profileId) return;
    setSaving(true);
    try {
      // When times vary by day, group days with identical times and save one task per group
      if (fixedDays && !isFlexible && timesVary) {
        const groups = groupDaysByTime(days, perDayTimes);
        for (const group of groups) {
          await onSave({
            profile_id: profileId,
            title: title.trim(),
            task_type: taskType,
            category_id: categoryId,
            frequency: 'weekly',
            days_of_week: group.days,
            times_per_week: null,
            estimated_minutes: isAllDay ? 480 : (
              group.start && group.end ? timeDiff(group.start, group.end) : duration
            ),
            location_id: locationId,
            start_time: group.start || null,
            end_time: group.end || null,
            enabled: existing?.enabled ?? true,
            is_flexible: false,
            not_before: notBefore || null,
            not_after: notAfter || null,
            notes: notes.trim() || null,
          });
        }
      } else {
        await onSave({
          profile_id: profileId,
          title: title.trim(),
          task_type: taskType,
          category_id: categoryId,
          frequency: 'weekly',
          days_of_week: fixedDays ? days : [],
          times_per_week: fixedDays ? null : timesPerWeek,
          estimated_minutes: isAllDay ? 480 : isFlexible ? duration : (
            startTime && endTime ? timeDiff(startTime, endTime) : duration
          ),
          location_id: locationId,
          start_time: isFlexible ? null : startTime || null,
          end_time: isFlexible ? null : endTime || null,
          enabled: existing?.enabled ?? true,
          is_flexible: fixedDays ? isFlexible : true,
          not_before: notBefore || null,
          not_after: notAfter || null,
          notes: notes.trim() || null,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/5 rounded-2xl border border-indigo-500/20 overflow-hidden">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pt-4 pb-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i + 1 === step ? 'w-6 bg-indigo-500' :
              i + 1 < step ? 'w-1.5 bg-indigo-500/50' :
              'w-1.5 bg-white/10'
            }`}
          />
        ))}
      </div>

      <div className="p-5">
        {/* Step 1: What is it? */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-white/60 text-sm font-medium">What's happening? ✏️</p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Class, Therapy, Visit kiddo"
              className="w-full h-14 bg-white/5 rounded-xl px-4 text-base text-white placeholder:text-white/20 border border-white/5 outline-none focus:border-indigo-500/40"
              autoFocus
            />

            {/* Auto-suggested type + category (appears after typing) */}
            {title.trim().length >= 2 && (
              <div className="space-y-3">
                {/* Type suggestion */}
                <div>
                  <p className="text-[11px] text-white/30 mb-2">
                    {!userOverrodeType && taskType ? "I'm guessing this is a..." : "What kind of thing is it?"}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'appointment' as TaskType, label: '📌 Appointment', desc: 'Class, doctor, meeting' },
                      { value: 'task' as TaskType, label: '👨‍👩‍👧 Family / Social', desc: 'Visits, hangouts, calls' },
                      { value: 'homework' as TaskType, label: '📚 School / Work', desc: 'Study, shifts, projects' },
                      { value: 'self_care' as TaskType, label: '💆 Wellness', desc: 'Health, fitness, spirituality' },
                      { value: 'errand' as TaskType, label: '🏃 Errands', desc: 'Grocery, shopping, pickup' },
                    ].map((t) => (
                      <button
                        key={t.value}
                        onClick={() => { setTaskType(t.value); setUserOverrodeType(true); }}
                        className={`p-3 rounded-xl text-left transition-all border ${
                          taskType === t.value
                            ? 'bg-indigo-600/20 border-indigo-500/40 text-white ring-1 ring-indigo-500/30'
                            : 'bg-white/3 border-white/5 text-white/40 hover:text-white/60'
                        }`}
                      >
                        <p className="text-sm font-medium">{t.label}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category suggestion */}
                {categories.filter((c) => c.enabled).length > 0 && (
                  <div>
                    <p className="text-[11px] text-white/30 mb-2">
                      {!userOverrodeCat && categoryId
                        ? `Filed under "${categories.find((c) => c.id === categoryId)?.name}" — tap to change`
                        : "Which category?"}
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                      {categories.filter((c) => c.enabled).map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => { setCategoryId(cat.id); setUserOverrodeCat(true); }}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            categoryId === cat.id
                              ? 'bg-indigo-600 text-white ring-1 ring-indigo-400/30'
                              : 'bg-white/5 text-white/30 hover:text-white/50'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Same days every week? */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-white/60 text-sm font-medium">Same days every week? 📆</p>

            {/* Fixed vs flexible days choice */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFixedDays(true)}
                className={`p-4 rounded-xl text-left border transition-colors ${
                  fixedDays === true
                    ? 'bg-indigo-600/20 border-indigo-500/40'
                    : 'bg-white/3 border-white/5'
                }`}
              >
                <p className="text-2xl mb-1">📌</p>
                <p className="text-sm font-medium text-white">Yes, set days</p>
                <p className="text-[10px] text-white/30 mt-0.5">Every Monday, every Wed & Fri, etc.</p>
              </button>
              <button
                onClick={() => { setFixedDays(false); setDays([]); }}
                className={`p-4 rounded-xl text-left border transition-colors ${
                  fixedDays === false
                    ? 'bg-indigo-600/20 border-indigo-500/40'
                    : 'bg-white/3 border-white/5'
                }`}
              >
                <p className="text-2xl mb-1">🔀</p>
                <p className="text-sm font-medium text-white">Nah, it varies</p>
                <p className="text-[10px] text-white/30 mt-0.5">Just needs to happen X times a week</p>
              </button>
            </div>

            {/* Branch A: Pick specific days */}
            {fixedDays === true && (
              <>
                <p className="text-[11px] text-white/30">Tap all that apply</p>
                <div className="grid grid-cols-4 gap-2">
                  {DAY_LABELS.map((label, i) => (
                    <button
                      key={i}
                      onClick={() => toggleDay(i)}
                      className={`h-14 rounded-xl text-sm font-medium transition-all flex flex-col items-center justify-center gap-0.5 ${
                        days.includes(i)
                          ? 'bg-indigo-600 text-white scale-105'
                          : 'bg-white/5 text-white/30 hover:text-white/50'
                      }`}
                    >
                      <span className="text-base">{DAY_EMOJI[i]}</span>
                      <span className="text-xs">{label}</span>
                    </button>
                  ))}
                </div>
                {/* Quick picks */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setDays([1, 2, 3, 4, 5])}
                    className="flex-1 h-10 rounded-lg text-xs text-white/30 bg-white/3 hover:bg-white/5 transition-colors"
                  >
                    Weekdays
                  </button>
                  <button
                    onClick={() => setDays([0, 6])}
                    className="flex-1 h-10 rounded-lg text-xs text-white/30 bg-white/3 hover:bg-white/5 transition-colors"
                  >
                    Weekends
                  </button>
                  <button
                    onClick={() => setDays([0, 1, 2, 3, 4, 5, 6])}
                    className="flex-1 h-10 rounded-lg text-xs text-white/30 bg-white/3 hover:bg-white/5 transition-colors"
                  >
                    Every day
                  </button>
                </div>
              </>
            )}

            {/* Branch B: How many times per week? */}
            {fixedDays === false && (
              <>
                <p className="text-[11px] text-white/30">How often per week?</p>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <button
                      key={n}
                      onClick={() => setTimesPerWeek(n)}
                      className={`h-14 rounded-xl text-sm font-medium transition-all flex flex-col items-center justify-center gap-0.5 ${
                        timesPerWeek === n
                          ? 'bg-indigo-600 text-white scale-105'
                          : 'bg-white/5 text-white/30 hover:text-white/50'
                      }`}
                    >
                      <span className="text-lg font-bold">{n}x</span>
                      <span className="text-[10px] text-white/30">/week</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-white/25 text-center italic">
                  Start with what's doable — you can always bump it up later
                </p>
              </>
            )}
          </div>
        )}

        {/* Step 3: When? */}
        {step === 3 && (
          <div className="space-y-4">
            {/* If days vary, time is always flexible — just ask duration */}
            {fixedDays === false ? (
              <>
                <p className="text-white/60 text-sm font-medium">How long each time? ⏱️</p>
                <DurationPicker
                  duration={duration}
                  setDuration={setDuration}
                  isAllDay={isAllDay}
                  setIsAllDay={setIsAllDay}
                  customDuration={customDuration}
                  setCustomDuration={setCustomDuration}
                />
              </>
            ) : (
              <>
                <p className="text-white/60 text-sm font-medium">Does it have a set time? ⏰</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsFlexible(false)}
                    className={`p-4 rounded-xl text-left border transition-colors ${
                      !isFlexible
                        ? 'bg-indigo-600/20 border-indigo-500/40'
                        : 'bg-white/3 border-white/5'
                    }`}
                  >
                    <p className="text-2xl mb-1">🕐</p>
                    <p className="text-sm font-medium text-white">Yes, fixed</p>
                    <p className="text-[10px] text-white/30 mt-0.5">Like a class or appointment</p>
                  </button>
                  <button
                    onClick={() => setIsFlexible(true)}
                    className={`p-4 rounded-xl text-left border transition-colors ${
                      isFlexible
                        ? 'bg-indigo-600/20 border-indigo-500/40'
                        : 'bg-white/3 border-white/5'
                    }`}
                  >
                    <p className="text-2xl mb-1">🤷</p>
                    <p className="text-sm font-medium text-white">Nah, flexible</p>
                    <p className="text-[10px] text-white/30 mt-0.5">Just needs to happen sometime</p>
                  </button>
                </div>

                {!isFlexible && (
                  <div className="space-y-3 mt-2">
                    {/* Same time vs different times toggle */}
                    {days.length > 1 && (
                      <button
                        onClick={() => {
                          setTimesVary(!timesVary);
                          // Seed per-day times from the shared time when switching to vary
                          if (!timesVary && startTime) {
                            const seeded: Record<number, { start: string; end: string }> = {};
                            for (const d of days) seeded[d] = { start: startTime, end: endTime };
                            setPerDayTimes(seeded);
                          }
                        }}
                        className={`w-full p-2.5 rounded-xl text-left border transition-colors flex items-center gap-2 ${
                          timesVary
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-white/3 border-white/5 text-white/30 hover:text-white/40'
                        }`}
                      >
                        <span className="text-sm">{timesVary ? '🔀' : '🔁'}</span>
                        <span className="text-xs font-medium">
                          {timesVary ? 'Different times per day' : 'Same time every day — tap if times vary'}
                        </span>
                      </button>
                    )}

                    {/* Same time for all days */}
                    {!timesVary && (
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-[11px] text-white/30 mb-1 block">Starts at</label>
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full h-12 bg-white/5 rounded-xl px-3 text-sm text-white border border-white/5 outline-none focus:border-indigo-500/40"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[11px] text-white/30 mb-1 block">Ends at</label>
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full h-12 bg-white/5 rounded-xl px-3 text-sm text-white border border-white/5 outline-none focus:border-indigo-500/40"
                          />
                        </div>
                      </div>
                    )}

                    {/* Per-day time inputs */}
                    {timesVary && (
                      <div className="space-y-2">
                        {days.sort((a, b) => a - b).map((d) => (
                          <div key={d} className="flex items-center gap-2">
                            <span className="text-sm w-12 shrink-0">
                              {DAY_EMOJI[d]} {DAY_LABELS[d]}
                            </span>
                            <input
                              type="time"
                              value={perDayTimes[d]?.start || ''}
                              onChange={(e) => setPerDayTimes((prev) => ({
                                ...prev,
                                [d]: { ...prev[d], start: e.target.value, end: prev[d]?.end || '' },
                              }))}
                              className="flex-1 h-10 bg-white/5 rounded-lg px-2 text-sm text-white border border-white/5 outline-none focus:border-indigo-500/40"
                            />
                            <span className="text-white/20 text-xs">to</span>
                            <input
                              type="time"
                              value={perDayTimes[d]?.end || ''}
                              onChange={(e) => setPerDayTimes((prev) => ({
                                ...prev,
                                [d]: { ...prev[d], start: prev[d]?.start || '', end: e.target.value },
                              }))}
                              className="flex-1 h-10 bg-white/5 rounded-lg px-2 text-sm text-white border border-white/5 outline-none focus:border-indigo-500/40"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {isFlexible && (
                  <div className="mt-2">
                    <label className="text-[11px] text-white/30 mb-2 block">About how long?</label>
                    <DurationPicker
                      duration={duration}
                      setDuration={setDuration}
                      isAllDay={isAllDay}
                      setIsAllDay={setIsAllDay}
                      customDuration={customDuration}
                      setCustomDuration={setCustomDuration}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 4: Where? */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-white/60 text-sm font-medium">Do you go somewhere for this? 📍</p>
            <div className="space-y-2">
              <button
                onClick={() => setLocationId(null)}
                className={`w-full p-3 rounded-xl text-left border transition-colors flex items-center gap-3 ${
                  !locationId
                    ? 'bg-indigo-600/20 border-indigo-500/40'
                    : 'bg-white/3 border-white/5'
                }`}
              >
                <span className="text-xl">🏠</span>
                <div>
                  <p className="text-sm font-medium text-white">Nope, staying put</p>
                  <p className="text-[10px] text-white/30">Home / wherever I am</p>
                </div>
              </button>
              {(locations || []).map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => setLocationId(loc.id)}
                  className={`w-full p-3 rounded-xl text-left border transition-colors flex items-center gap-3 ${
                    locationId === loc.id
                      ? 'bg-indigo-600/20 border-indigo-500/40'
                      : 'bg-white/3 border-white/5'
                  }`}
                >
                  <MapPin size={18} className="text-indigo-400" />
                  <div>
                    <p className="text-sm font-medium text-white">{loc.name}</p>
                    {loc.is_home && <p className="text-[10px] text-white/30">Home base</p>}
                  </div>
                </button>
              ))}
            </div>

          </div>
        )}

        {/* Step 5: Any rules? */}
        {step === 5 && (
          <div className="space-y-4">
            <p className="text-white/60 text-sm font-medium">Any rules or preferences? 🚧</p>
            <p className="text-[11px] text-white/30">Totally optional — skip if there aren't any</p>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[11px] text-white/30 mb-1 block">Not before</label>
                <input
                  type="time"
                  value={notBefore}
                  onChange={(e) => setNotBefore(e.target.value)}
                  placeholder="e.g. 3pm"
                  className="w-full h-12 bg-white/5 rounded-xl px-3 text-sm text-white border border-white/5 outline-none focus:border-indigo-500/40"
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] text-white/30 mb-1 block">Not after</label>
                <input
                  type="time"
                  value={notAfter}
                  onChange={(e) => setNotAfter(e.target.value)}
                  placeholder="e.g. 7pm"
                  className="w-full h-12 bg-white/5 rounded-xl px-3 text-sm text-white border border-white/5 outline-none focus:border-indigo-500/40"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-white/30 mb-1 block">Anything else to know?</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Preferably when I'm already nearby"
                className="w-full h-12 bg-white/5 rounded-xl px-3 text-sm text-white placeholder:text-white/20 border border-white/5 outline-none focus:border-indigo-500/40"
              />
            </div>

            {/* Ask Nudgley — premium feature teaser */}
            <div className="pt-2 border-t border-white/5">
              <button
                type="button"
                className="w-full p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-left flex items-center gap-3 hover:bg-indigo-500/15 transition-colors"
                onClick={() => toast('Nudgley scheduling advice is a premium feature! Coming soon.')}
              >
                <span className="text-xl">🤖</span>
                <div>
                  <p className="text-sm font-medium text-indigo-400">Ask Nudgley for advice</p>
                  <p className="text-[10px] text-white/30">Not sure when to schedule this? Let Nudgley help figure it out</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-2 px-5 pb-5">
        {onDelete && step === 1 && (
          <button
            onClick={onDelete}
            className="h-12 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
            aria-label="Delete"
          >
            <Trash2 size={16} />
          </button>
        )}
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="h-12 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
        ) : (
          <button
            onClick={onCancel}
            className="h-12 px-5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 text-sm transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!canAdvance() || saving}
          className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-colors"
        >
          {saving ? 'Saving...' : step === TOTAL_STEPS ? (existing ? 'Save Changes ✓' : 'Add It! 🎉') : (
            <>Next <ArrowRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Duration Picker ──────────────────────────────────────────────

function DurationPicker({
  duration, setDuration, isAllDay, setIsAllDay, customDuration, setCustomDuration,
}: {
  duration: number;
  setDuration: (d: number) => void;
  isAllDay: boolean;
  setIsAllDay: (v: boolean) => void;
  customDuration: string;
  setCustomDuration: (v: string) => void;
}) {
  const presets = [15, 30, 60, 90, 120, 180];
  const isPreset = !isAllDay && presets.includes(duration);
  const isCustom = !isAllDay && !isPreset && duration > 0;

  return (
    <div className="space-y-3">
      {/* All day toggle */}
      <button
        onClick={() => {
          setIsAllDay(!isAllDay);
          if (!isAllDay) setDuration(480);
          else setDuration(60);
        }}
        className={`w-full p-3 rounded-xl text-left border transition-colors flex items-center gap-3 ${
          isAllDay
            ? 'bg-indigo-600/20 border-indigo-500/40'
            : 'bg-white/3 border-white/5 hover:bg-white/5'
        }`}
      >
        <span className="text-xl">🌅</span>
        <div>
          <p className="text-sm font-medium text-white">All day</p>
          <p className="text-[10px] text-white/30">Blocks off the whole day — no other tasks scheduled</p>
        </div>
      </button>

      {/* Preset + custom durations (hidden when all day) */}
      {!isAllDay && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((m) => (
              <button
                key={m}
                onClick={() => { setDuration(m); setCustomDuration(''); }}
                className={`h-12 rounded-xl text-sm font-medium transition-colors ${
                  duration === m && !isCustom
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-white/30 hover:text-white/50'
                }`}
              >
                {m < 60 ? `${m} min` : m === 60 ? '1 hr' : `${m / 60} hr`}
              </button>
            ))}
          </div>

          {/* Custom duration input */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/30 shrink-0">Or:</span>
            <input
              type="number"
              value={customDuration}
              onChange={(e) => {
                setCustomDuration(e.target.value);
                const mins = parseInt(e.target.value);
                if (mins > 0) setDuration(mins);
              }}
              placeholder="Custom minutes"
              min={5}
              className={`flex-1 h-10 bg-white/5 rounded-xl px-3 text-sm text-white placeholder:text-white/20 border outline-none focus:border-indigo-500/40 ${
                isCustom ? 'border-indigo-500/40' : 'border-white/5'
              }`}
            />
            <span className="text-[11px] text-white/20">min</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

function groupDaysByTime(
  days: number[],
  perDayTimes: Record<number, { start: string; end: string }>
): { days: number[]; start: string; end: string }[] {
  const groups: { days: number[]; start: string; end: string }[] = [];
  for (const d of days) {
    const t = perDayTimes[d];
    if (!t) continue;
    const existing = groups.find((g) => g.start === t.start && g.end === t.end);
    if (existing) {
      existing.days.push(d);
    } else {
      groups.push({ days: [d], start: t.start, end: t.end });
    }
  }
  return groups;
}

function timeDiff(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.max(15, (eh * 60 + em) - (sh * 60 + sm));
}

function groupByDay(tasks: RecurringTask[]): Map<number, RecurringTask[]> {
  const map = new Map<number, RecurringTask[]>();
  for (const t of tasks) {
    if (!t.days_of_week) continue;
    for (const d of t.days_of_week) {
      const existing = map.get(d) || [];
      // Avoid duplicate entries (same task shown under multiple days)
      if (!existing.some((e) => e.id === t.id)) existing.push(t);
      map.set(d, existing);
    }
  }
  for (const [day, dayTasks] of map) {
    map.set(day, dayTasks.sort((a, b) => {
      if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time);
      if (a.start_time) return -1;
      if (b.start_time) return 1;
      return 0;
    }));
  }
  return map;
}
