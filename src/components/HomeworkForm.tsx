import { useState } from 'react';
import { BookOpen, Clipboard, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useProfileId } from '../hooks/useProfileId';
import { useCreateTask } from '../hooks/useTasks';
import type { HomeworkEstimate } from '../types';

interface HomeworkFormProps {
  onClose: () => void;
}

export default function HomeworkForm({ onClose }: HomeworkFormProps) {
  const profileId = useProfileId();
  const [text, setText] = useState('');
  const [courseName, setCourseName] = useState('');
  const [estimate, setEstimate] = useState<HomeworkEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const createTask = useCreateTask();

  const handleEstimate = async () => {
    if (!text.trim()) {
      toast.error('Paste the assignment details first');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('estimate-homework', {
        body: { text: text.trim(), courseName: courseName.trim() },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setEstimate(data as HomeworkEstimate);
    } catch (err) {
      toast.error('AI estimation failed — try again');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSessions = async () => {
    if (!estimate) return;

    for (const session of estimate.sessions) {
      await createTask.mutateAsync({
        profile_id: profileId,
        title: `${estimate.title}: ${session.title}`,
        description: null,
        task_type: 'homework',
        priority: 'soon',
        status: 'pending',
        category_id: 'homework',
        estimated_minutes: session.minutes,
        ai_estimated_minutes: session.minutes,
        actual_minutes: null,
        due_date: null,
        due_time: null,
        scheduled_date: null,
        scheduled_start_time: null,
        scheduled_end_time: null,
        location_id: null,
        needs_travel: false,
        prep_minutes: 0,
        homework_type: estimate.type as 'essay' | 'reading' | 'problem_set' | 'project' | 'quiz_prep',
        course_name: courseName || null,
        syllabus_text: text.substring(0, 500),
        difficulty_score: estimate.difficulty,
        is_recurring: false,
        recurring_task_id: null,
      });
    }

    toast.success(`${estimate.sessions.length} study sessions created`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[90vh] bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-white/10 p-5 space-y-4 animate-fade-in-up overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-purple-400" />
            <h2 className="text-lg font-bold text-white">Add Homework</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/40">
            <X size={20} />
          </button>
        </div>

        <input
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          placeholder="Course name (optional)"
          className="w-full h-12 bg-white/5 rounded-xl px-4 text-sm text-white placeholder:text-white/20 border border-white/5 outline-none"
        />

        <div>
          <p className="text-xs text-white/40 mb-2">Paste assignment details, syllabus text, or describe the work:</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste here..."
            rows={5}
            className="w-full bg-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 border border-white/5 outline-none resize-none"
          />
        </div>

        {!estimate && (
          <button
            onClick={handleEstimate}
            disabled={loading || !text.trim()}
            className="w-full h-14 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Clipboard size={18} />
                Estimate with AI
              </>
            )}
          </button>
        )}

        {/* AI estimate results */}
        {estimate && (
          <div className="space-y-3">
            <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
              <h3 className="text-sm font-semibold text-purple-400">{estimate.title}</h3>
              <div className="flex items-center gap-3 mt-2 text-xs text-white/50">
                <span>Type: {estimate.type}</span>
                <span>Difficulty: {estimate.difficulty}/10</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                <span>Typical: {estimate.neurotypicalMinutes}min</span>
                <span className="text-purple-400 font-medium">
                  ADHD-adjusted: {estimate.adhdAdjustedMinutes}min
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs text-white/40 mb-2">Suggested study sessions:</p>
              {estimate.sessions.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 bg-white/3 rounded-lg mb-1">
                  <span className="text-sm text-white/70">{s.title}</span>
                  <span className="text-xs text-white/30">{s.minutes}min</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddSessions}
              disabled={createTask.isPending}
              className="w-full h-14 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-2xl text-white font-semibold transition-colors"
            >
              Add {estimate.sessions.length} Sessions to Tasks
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
