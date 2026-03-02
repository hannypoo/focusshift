import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppShell from './components/AppShell';

const TodayView = lazy(() => import('./pages/TodayView'));
const WeekView = lazy(() => import('./pages/WeekView'));
const MonthView = lazy(() => import('./pages/MonthView'));
const TasksView = lazy(() => import('./pages/TasksView'));
const ProfileView = lazy(() => import('./pages/ProfileView'));
const SettingsView = lazy(() => import('./pages/SettingsView'));
const LoginView = lazy(() => import('./pages/LoginView'));
const SignupView = lazy(() => import('./pages/SignupView'));
const OnboardingView = lazy(() => import('./pages/OnboardingView'));

function LoadingFallback() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-950">
      <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function OnboardingWrapper() {
  const navigate = useNavigate();
  return <OnboardingView onComplete={() => navigate('/')} />;
}

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginView />} />
        <Route path="/signup" element={<SignupView />} />

        {/* Protected routes */}
        <Route path="/onboarding" element={
          <AuthGuard><OnboardingWrapper /></AuthGuard>
        } />
        <Route path="/*" element={
          <AuthGuard>
            <AppShell>
              <Routes>
                <Route path="/" element={<TodayView />} />
                <Route path="/week" element={<WeekView />} />
                <Route path="/month" element={<MonthView />} />
                <Route path="/tasks" element={<TasksView />} />
                <Route path="/profile" element={<ProfileView />} />
                <Route path="/settings" element={<SettingsView />} />
              </Routes>
            </AppShell>
          </AuthGuard>
        } />
      </Routes>
    </Suspense>
  );
}
