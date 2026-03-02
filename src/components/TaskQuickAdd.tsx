import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Category } from '../types';
import type { TaskType, TaskPriority } from '../types/database';
import { getCategoryColors } from '../lib/utils';
import { useCreateTask } from '../hooks/useTasks';
import { useProfileId } from '../hooks/useProfileId';

interface TaskQuickAddProps {
  categories: Category[];
  onClose: () => void;
}

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'task', label: 'Task' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'homework', label: 'Homework' },
  { value: 'errand', label: 'Errand' },
  { value: 'self_care', label: 'Self-Care' },
];

const PRIORITIES: { value: TaskPriority; label: string; desc: string }[] = [
  { value: 'immediately', label: 'Now', desc: 'Do today' },
  { value: 'soon', label: 'Soon', desc: 'This week' },
  { value: 'whenever', label: 'Whenever', desc: 'No rush' },
];

const ESTIMATES = [15, 30, 45, 60, 90, 120];

export default function TaskQuickAdd({ categories, onClose }: TaskQuickAddProps) {
  const profileId = useProfileId();
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('task');
  const [priority, setPriority] = useState<TaskPriority>('soon');
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || 'general-todo');
  const [estimate, setEstimate] = useState(30);
  const createTask = useCreateTask();

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Give it a name first');
      return;
    }

    await createTask.mutateAsync({
      profile_id: profileId,
      title: title.trim(),
      description: null,
      task_type: taskType,
      priority,
      status: 'pending',
      category_id: categoryId,
      estimated_minutes: estimate,
      ai_estimated_minutes: null,
      actual_minutes: null,
      due_date: null,
      due_time: null,
      scheduled_date: null,
      scheduled_start_time: null,
      scheduled_end_time: null,
      location_id: null,
      needs_travel: false,
      prep_minutes: 0,
      homework_type: null,
      course_name: null,
      syllabus_text: null,
      difficulty_score: null,
      difficulty: null,
      is_multitaskable: false,
      is_recurring: false,
      recurring_task_id: null,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-white/10 p-5 space-y-5 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Quick Add</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/40">
            <X size={20} />
          </button>
        </div>

        {/* Title input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          className="w-full h-14 bg-white/5 rounded-2xl px-4 text-white placeholder:text-white/25 border border-white/10 focus:border-indigo-500/50 outline-none text-base"
          autoFocus
        />

        {/* Type chips */}
        <div>
          <p className="text-xs text-white/40 mb-2">Type</p>
          <div className="flex flex-wrap gap-2">
            {TASK_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTaskType(t.value)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  taskType === t.value
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                    : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/10'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority chips */}
        <div>
          <p className="text-xs text-white/40 mb-2">Priority</p>
          <div className="flex gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                onClick={() => setPriority(p.value)}
                className={`flex-1 py-3 rounded-xl text-center transition-colors ${
                  priority === p.value
                    ? p.value === 'immediately'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : p.value === 'soon'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-white/10 text-white/70 border border-white/20'
                    : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
                }`}
              >
                <div className="font-medium text-sm">{p.label}</div>
                <div className="text-[10px] opacity-60">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <p className="text-xs text-white/40 mb-2">Category</p>
          <div className="flex flex-wrap gap-2">
            {categories.filter((c) => c.enabled).map((cat) => {
              const colors = getCategoryColors(cat.color);
              const selected = categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    selected
                      ? `${colors.bgLight} ${colors.text} border ${colors.border}`
                      : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time estimate */}
        <div>
          <p className="text-xs text-white/40 mb-2">Estimate</p>
          <div className="flex gap-2 flex-wrap">
            {ESTIMATES.map((min) => (
              <button
                key={min}
                onClick={() => setEstimate(min)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  estimate === min
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                    : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
                }`}
              >
                {min >= 60 ? `${min / 60}h` : `${min}m`}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={createTask.isPending}
          className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-2xl transition-colors text-base flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Add Task
        </button>
      </div>
    </div>
  );
}
