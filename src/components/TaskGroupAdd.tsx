import { useState } from 'react';
import { X, Calendar, BookOpen, ShoppingCart, Heart, MoreHorizontal, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { TaskType, TaskDifficulty } from '../types/database';
import { useCreateTask } from '../hooks/useTasks';
import { useProfileId } from '../hooks/useProfileId';

interface TaskGroupAddProps {
  onClose: () => void;
}

const GROUPS = [
  { id: 'appointment' as TaskType, label: 'Appointment', icon: Calendar, color: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    specifics: ['Doctor', 'Therapy', 'Meeting', 'Interview', 'Class', 'Phone call'] },
  { id: 'homework' as TaskType, label: 'Homework', icon: BookOpen, color: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    specifics: ['Essay', 'Reading', 'Problem set', 'Project work', 'Quiz prep', 'Research'] },
  { id: 'errand' as TaskType, label: 'Errand', icon: ShoppingCart, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    specifics: ['Grocery shopping', 'Pick up prescription', 'Return item', 'Bank', 'Post office', 'Car maintenance'] },
  { id: 'self_care' as TaskType, label: 'Self-Care', icon: Heart, color: 'bg-teal-500/20 text-teal-400 border-teal-500/40',
    specifics: ['Shower', 'Exercise', 'Cook a meal', 'Meditation', 'Laundry', 'Clean room'] },
  { id: 'task' as TaskType, label: 'Other', icon: MoreHorizontal, color: 'bg-gray-500/20 text-gray-400 border-gray-500/40',
    specifics: [] },
];

const DIFFICULTIES: { value: TaskDifficulty; label: string; color: string; desc: string }[] = [
  { value: 'easy', label: 'Easy', color: 'bg-green-500/20 text-green-400 border-green-500/40', desc: 'Quick & mindless' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40', desc: 'Some focus needed' },
  { value: 'hard', label: 'Hard', color: 'bg-red-500/20 text-red-400 border-red-500/40', desc: 'Full brain power' },
];

type Step = 'group' | 'specific' | 'difficulty';

export default function TaskGroupAdd({ onClose }: TaskGroupAddProps) {
  const profileId = useProfileId();
  const createTask = useCreateTask();

  const [step, setStep] = useState<Step>('group');
  const [selectedGroup, setSelectedGroup] = useState<typeof GROUPS[0] | null>(null);
  const [title, setTitle] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  const handleGroupSelect = (group: typeof GROUPS[0]) => {
    setSelectedGroup(group);
    if (group.specifics.length === 0) {
      // "Other" — go straight to write-in + difficulty
      setStep('difficulty');
    } else {
      setStep('specific');
    }
  };

  const handleSpecificSelect = (specific: string) => {
    setTitle(specific);
    setStep('difficulty');
  };

  const handleWriteIn = () => {
    if (!customTitle.trim()) return;
    setTitle(customTitle.trim());
    setStep('difficulty');
  };

  const handleDifficultySelect = async (difficulty: TaskDifficulty) => {
    const finalTitle = title || customTitle.trim();
    if (!finalTitle) {
      toast.error('Give it a name first');
      return;
    }
    if (!profileId) return;

    await createTask.mutateAsync({
      profile_id: profileId,
      title: finalTitle,
      description: null,
      task_type: selectedGroup?.id || 'task',
      priority: 'soon',
      status: 'pending',
      category_id: null,
      estimated_minutes: difficulty === 'hard' ? 60 : difficulty === 'medium' ? 30 : 15,
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
      difficulty,
      is_multitaskable: false,
      is_recurring: false,
      recurring_task_id: null,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-white/10 p-5 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {step !== 'group' && (
              <button onClick={() => setStep(step === 'difficulty' && selectedGroup?.specifics.length ? 'specific' : 'group')}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40">
                <ChevronLeft size={18} />
              </button>
            )}
            <h2 className="text-lg font-bold text-white">
              {step === 'group' ? 'Add Task' : step === 'specific' ? selectedGroup?.label : 'How hard?'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/40">
            <X size={20} />
          </button>
        </div>

        {/* Step 1: Group selection */}
        {step === 'group' && (
          <div className="grid grid-cols-2 gap-3">
            {GROUPS.map((group) => {
              const Icon = group.icon;
              return (
                <button key={group.id} onClick={() => handleGroupSelect(group)}
                  className={`flex flex-col items-center gap-2 p-5 rounded-2xl border transition-all hover:scale-[1.02] min-h-[80px] ${group.color}`}>
                  <Icon size={28} />
                  <span className="text-sm font-medium">{group.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 2: Specific selection */}
        {step === 'specific' && selectedGroup && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {selectedGroup.specifics.map((specific) => (
                <button key={specific} onClick={() => handleSpecificSelect(specific)}
                  className="px-4 py-4 rounded-xl text-sm font-medium bg-white/5 text-white/60 border border-white/5 hover:bg-white/10 transition-colors text-left min-h-[56px]">
                  {specific}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleWriteIn()}
                placeholder="Or type your own..."
                className="flex-1 h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/25 outline-none"
                autoFocus
              />
              <button onClick={handleWriteIn} disabled={!customTitle.trim()}
                className="h-12 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 rounded-xl text-sm text-white font-medium transition-colors">
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Difficulty */}
        {step === 'difficulty' && (
          <div className="space-y-4">
            {title && (
              <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                <p className="text-sm text-white">{title}</p>
                <p className="text-[11px] text-white/30">{selectedGroup?.label || 'Task'}</p>
              </div>
            )}
            {!title && (
              <input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="What needs doing?"
                className="w-full h-14 bg-white/5 rounded-2xl px-4 text-white placeholder:text-white/25 border border-white/10 outline-none text-base"
                autoFocus
              />
            )}
            <div className="flex gap-3">
              {DIFFICULTIES.map(({ value, label, color, desc }) => (
                <button key={value} onClick={() => handleDifficultySelect(value)}
                  className={`flex-1 py-5 rounded-2xl text-center border transition-all hover:scale-[1.02] min-h-[80px] ${color}`}>
                  <div className="font-semibold text-base">{label}</div>
                  <div className="text-[11px] opacity-60 mt-0.5">{desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
