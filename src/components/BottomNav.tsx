import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { CalendarDays, CalendarRange, CalendarCheck, ListTodo, MoreHorizontal, User, Settings, Repeat } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Today', icon: CalendarDays },
  { path: '/week', label: 'Week', icon: CalendarRange },
  { path: '/month', label: 'Month', icon: CalendarCheck },
  { path: '/tasks', label: 'Tasks', icon: ListTodo },
] as const;

const MORE_ITEMS = [
  { path: '/schedule', label: 'Weekly Schedule', icon: Repeat },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/settings', label: 'Settings', icon: Settings },
] as const;

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = MORE_ITEMS.some((item) => location.pathname === item.path);

  return (
    <>
      {/* More sheet overlay */}
      {moreOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More sheet */}
      {moreOpen && (
        <div className="fixed bottom-[72px] left-0 right-0 z-50 px-4 pb-2 animate-fade-in-up">
          <div className="bg-slate-900/95 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
            {MORE_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMoreOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-5 py-4 transition-colors ${
                    active
                      ? 'text-indigo-400 bg-indigo-500/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav
        className="flex-shrink-0 bg-slate-900/95 backdrop-blur-lg border-t border-white/5 px-2"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 py-2 px-3 min-h-[56px] transition-colors ${
                  active ? 'text-indigo-400' : 'text-white/40 hover:text-white/70'
                }`}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center gap-1 py-2 px-3 min-h-[56px] transition-colors ${
              isMoreActive || moreOpen ? 'text-indigo-400' : 'text-white/40 hover:text-white/70'
            }`}
            aria-label="More options"
            aria-expanded={moreOpen}
          >
            <MoreHorizontal size={22} strokeWidth={isMoreActive || moreOpen ? 2.5 : 2} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
