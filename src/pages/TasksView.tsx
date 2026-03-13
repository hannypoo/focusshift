import { useState, useMemo } from 'react';
import { Plus, Check, Trash2, Clock, AlertCircle, CalendarClock, Inbox, BookOpen, Calendar } from 'lucide-react';
import { useTasks, useUpdateTask, useDeleteTask } from '../hooks/useTasks';
import { useCategories } from '../hooks/useCategories';
import TaskQuickAdd from '../components/TaskQuickAdd';
import HomeworkForm from '../components/HomeworkForm';
import AppointmentForm from '../components/AppointmentForm';
import CategoryPill from '../components/CategoryPill';
import { formatTime } from '../lib/utils';
import type { Task, TaskPriority } from '../types/database';

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; icon: typeof AlertCircle; color: string }> = {
  immediately: { label: 'Immediately', icon: AlertCircle, color: 'text-red-400' },
  soon: { label: 'Soon', icon: CalendarClock, color: 'text-amber-400' },
  whenever: { label: 'Whenever', icon: Inbox, color: 'text-white/40' },
};

export default function TasksView() {
  const [showAdd, setShowAdd] = useState(false);
  const [showHomework, setShowHomework] = useState(false);
  const [showAppointment, setShowAppointment] = useState(false);
  const { data: tasks, isLoading: tasksLoading } = useTasks({ status: ['pending', 'scheduled', 'in_progress'] });
  const { data: completedTasks } = useTasks({ status: ['completed'] });
  const { data: categories, isLoading: catsLoading } = useCategories();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  if (tasksLoading || catsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Group by priority
  const grouped = useMemo(() => {
    if (!tasks) return { immediately: [], soon: [], whenever: [] };
    const groups: Record<TaskPriority, Task[]> = { immediately: [], soon: [], whenever: [] };
    for (const t of tasks) {
      groups[t.priority].push(t);
    }
    return groups;
  }, [tasks]);

  const handleComplete = async (id: string) => {
    await updateTask.mutateAsync({ id, status: 'completed' });
  };

  const handleDelete = async (id: string) => {
    await deleteTask.mutateAsync(id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Tasks</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHomework(true)}
            className="p-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 transition-colors"
            aria-label="Add homework"
          >
            <BookOpen size={18} />
          </button>
          <button
            onClick={() => setShowAppointment(true)}
            className="p-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 transition-colors"
            aria-label="Add appointment"
          >
            <Calendar size={18} />
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white transition-colors"
          >
            <Plus size={18} />
            Add
          </button>
        </div>
      </div>

      {/* Task sections */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-6">
        {(['immediately', 'soon', 'whenever'] as const).map((priority) => {
          const config = PRIORITY_CONFIG[priority];
          const Icon = config.icon;
          const items = grouped[priority];

          return (
            <div key={priority}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={config.color} />
                <h2 className={`text-sm font-semibold ${config.color}`}>
                  {config.label}
                </h2>
                <span className="text-xs text-white/20">{items.length}</span>
              </div>

              {items.length === 0 ? (
                <p className="text-xs text-white/20 py-3 text-center bg-white/3 rounded-xl">
                  Nothing here — nice!
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      categories={categories || []}
                      onComplete={handleComplete}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Completed section */}
        {completedTasks && completedTasks.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-white/30 mb-2">
              Completed ({completedTasks.length})
            </h2>
            <div className="space-y-1">
              {completedTasks.slice(0, 10).map((task) => (
                <div key={task.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/3 opacity-50">
                  <Check size={16} className="text-emerald-500" />
                  <span className="text-sm text-white/40 line-through flex-1">{task.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAdd && categories && (
        <TaskQuickAdd categories={categories} onClose={() => setShowAdd(false)} />
      )}
      {showHomework && <HomeworkForm onClose={() => setShowHomework(false)} />}
      {showAppointment && <AppointmentForm onClose={() => setShowAppointment(false)} />}
    </div>
  );
}

function TaskRow({
  task,
  categories,
  onComplete,
  onDelete,
}: {
  task: Task;
  categories: { id: string; name: string; color: string }[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cat = categories.find((c) => c.id === task.category_id);

  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/8 transition-colors group">
      {/* Complete button */}
      <button
        onClick={() => onComplete(task.id)}
        className="w-7 h-7 rounded-full border-2 border-white/20 hover:border-emerald-500 hover:bg-emerald-500/20 flex items-center justify-center transition-colors shrink-0"
        aria-label="Complete task"
      >
        <Check size={14} className="text-white/0 group-hover:text-emerald-400 transition-colors" />
      </button>

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {cat && <CategoryPill name={cat.name} color={cat.color} />}
          {task.estimated_minutes && (
            <span className="flex items-center gap-1 text-[10px] text-white/25">
              <Clock size={10} />
              {formatTime(task.estimated_minutes)}
            </span>
          )}
          {task.due_date && (
            <span className="text-[10px] text-white/25">
              Due {task.due_date}
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-all"
        aria-label="Delete task"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
