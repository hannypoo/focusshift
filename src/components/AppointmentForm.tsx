import { useState } from 'react';
import { Calendar, MapPin, Clock, X } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateTask } from '../hooks/useTasks';
import { useLocations } from '../hooks/useLocations';
import { useProfileId } from '../hooks/useProfileId';

interface AppointmentFormProps {
  onClose: () => void;
}

const PREP_OPTIONS = [0, 5, 10, 15, 30];

export default function AppointmentForm({ onClose }: AppointmentFormProps) {
  const profileId = useProfileId();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [locationId, setLocationId] = useState<string | null>(null);
  const [prepMinutes, setPrepMinutes] = useState(0);
  const { data: locations } = useLocations();
  const createTask = useCreateTask();

  const handleSubmit = async () => {
    if (!title.trim() || !date || !startTime) {
      toast.error('Fill in the basics first');
      return;
    }
    if (!profileId) return;

    await createTask.mutateAsync({
      profile_id: profileId,
      title: title.trim(),
      description: null,
      task_type: 'appointment',
      priority: 'immediately',
      status: 'scheduled',
      category_id: 'class-appointments',
      estimated_minutes: null,
      ai_estimated_minutes: null,
      actual_minutes: null,
      due_date: date,
      due_time: startTime,
      scheduled_date: date,
      scheduled_start_time: startTime,
      scheduled_end_time: endTime || null,
      location_id: locationId,
      needs_travel: !!locationId,
      prep_minutes: prepMinutes,
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
      <div className="relative w-full max-w-md bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-white/10 p-5 space-y-4 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-blue-400" />
            <h2 className="text-lg font-bold text-white">Add Appointment</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/40">
            <X size={20} />
          </button>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Appointment name"
          className="w-full h-14 bg-white/5 rounded-2xl px-4 text-white placeholder:text-white/25 border border-white/10 outline-none text-base"
          autoFocus
        />

        {/* Date & Time */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-3 sm:col-span-1">
            <label className="text-[10px] text-white/30 mb-1 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-12 bg-white/5 rounded-xl px-3 text-sm text-white border border-white/5 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-white/30 mb-1 block">Start</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full h-12 bg-white/5 rounded-xl px-3 text-sm text-white border border-white/5 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-white/30 mb-1 block">End</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full h-12 bg-white/5 rounded-xl px-3 text-sm text-white border border-white/5 outline-none"
            />
          </div>
        </div>

        {/* Location */}
        {locations && locations.length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-2">
              <MapPin size={12} className="text-white/30" />
              <p className="text-xs text-white/40">Location</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setLocationId(null)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  !locationId ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40' : 'bg-white/5 text-white/40 border border-white/5'
                }`}
              >
                None
              </button>
              {(locations || []).map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => setLocationId(loc.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    locationId === loc.id ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40' : 'bg-white/5 text-white/40 border border-white/5'
                  }`}
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prep time */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <Clock size={12} className="text-white/30" />
            <p className="text-xs text-white/40">Prep time before</p>
          </div>
          <div className="flex gap-2">
            {PREP_OPTIONS.map((min) => (
              <button
                key={min}
                onClick={() => setPrepMinutes(min)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  prepMinutes === min ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40' : 'bg-white/5 text-white/40 border border-white/5'
                }`}
              >
                {min === 0 ? 'None' : `${min}m`}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={createTask.isPending}
          className="w-full h-14 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-2xl text-white font-semibold transition-colors"
        >
          Add Appointment
        </button>
      </div>
    </div>
  );
}
