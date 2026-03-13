import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

export default function LoginView() {
  const { signIn, signInWithMagicLink } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      navigate('/');
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast.error('Enter your email first');
      return;
    }

    setLoading(true);
    const { error } = await signInWithMagicLink(email);
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setMagicLinkSent(true);
      toast.success('Check your email for the login link!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap size={32} className="text-indigo-400" />
            <h1 className="text-3xl font-bold text-white">Offload</h1>
          </div>
          <p className="text-white/40 text-sm">Your ADHD-friendly life manager</p>
        </div>

        {magicLinkSent ? (
          <div className="bg-white/5 rounded-2xl p-6 text-center space-y-4">
            <Mail size={48} className="text-indigo-400 mx-auto" />
            <p className="text-white text-sm">
              Magic link sent to <strong>{email}</strong>
            </p>
            <p className="text-white/40 text-xs">Check your email and click the link to sign in.</p>
            <button
              onClick={() => setMagicLinkSent(false)}
              className="text-indigo-400 text-sm hover:text-indigo-300"
            >
              Try again
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-3">
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  autoComplete="email"
                />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              Sign In
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-gray-950 text-white/30">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleMagicLink}
              disabled={loading}
              className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/70 font-medium rounded-xl border border-white/10 transition-colors disabled:opacity-50"
            >
              Send Magic Link
            </button>
          </form>
        )}

        <p className="text-center text-white/30 text-sm">
          Don't have an account?{' '}
          <Link to="/signup" className="text-indigo-400 hover:text-indigo-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
