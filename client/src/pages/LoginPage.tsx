import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Lock,
  Mail,
  Github,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth, getRoleRedirect } from '../context/AuthContext';
import { Role } from '@shared/types';
import { PublicNavbar } from '../components/PublicNavbar';
import { OAuthModal } from '../components/OAuthModal';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [coldStartNotice, setColdStartNotice] = useState(false);

  // OAuth Modal state
  const [oauthProvider, setOauthProvider] = useState<'google' | 'github' | 'microsoft' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please enter your email/phone and password.');
      return;
    }

    setError(null);
    setLoading(true);
    setColdStartNotice(false);

    const coldTimer = setTimeout(() => {
      setColdStartNotice(true);
    }, 3500);

    try {
      const loginPromise = login(identifier, password);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'Server took too long to respond. The backend may still be spinning up from cold start — please try again.'
              )
            ),
          20000
        )
      );

      const user = (await Promise.race([loginPromise, timeoutPromise])) as any;
      clearTimeout(coldTimer);
      const redirectPath = getRoleRedirect(user.role as Role);
      navigate(redirectPath);
    } catch (err: any) {
      clearTimeout(coldTimer);
      setError(err.message || 'Invalid credentials. Please verify your details.');
    } finally {
      clearTimeout(coldTimer);
      setLoading(false);
      setColdStartNotice(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col justify-between">
      <PublicNavbar />

      <div className="flex-1 flex items-center justify-center p-6 my-8">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-bridge-teal font-semibold">
              SkillBridge Console Access
            </span>
            <h1 className="font-serif text-3xl font-bold text-ink">
              Welcome back
            </h1>
            <p className="text-xs text-ink-muted">
              Enter your credentials to access your verified career workspace.
            </p>
          </div>

          {/* Main Login Form */}
          <div className="bg-white border border-line rounded-2xl p-7 shadow-campus-card space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-status-red/10 border border-status-red/20 text-status-red text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Email Address or Phone Number
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="e.g. name@university.edu or +91 98765 43210"
                    required
                    className="w-full bg-paper border border-line rounded-xl pl-10 pr-4 py-2.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-bridge-teal transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-ink">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-mono text-bridge-teal hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-paper border border-line rounded-xl pl-10 pr-4 py-2.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-bridge-teal transition-colors"
                  />
                </div>
              </div>

              {coldStartNotice && loading && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-bridge-teal/10 border border-bridge-teal/20 text-bridge-teal text-xs animate-in fade-in duration-200">
                  <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
                  <span>Waking up server backend (Render cold-start)... Hang tight!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="font-mono flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  <>
                    <span>Log in</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-line" />
              </div>
              <div className="relative flex justify-center text-[10.5px] font-mono uppercase tracking-wider bg-white px-2 text-ink-muted">
                or continue with
              </div>
            </div>

            {/* 3 OAuth Buttons: Google, GitHub, Microsoft */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setOauthProvider('google')}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-line hover:border-ink text-xs font-medium text-ink transition-colors bg-paper hover:bg-white"
                title="Sign in with Google"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="text-[11px] font-medium">Google</span>
              </button>

              <button
                type="button"
                onClick={() => setOauthProvider('github')}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-line hover:border-ink text-xs font-medium text-ink transition-colors bg-paper hover:bg-white"
                title="Sign in with GitHub"
              >
                <Github className="w-4 h-4 flex-shrink-0" />
                <span className="text-[11px] font-medium">GitHub</span>
              </button>

              <button
                type="button"
                onClick={() => setOauthProvider('microsoft')}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-line hover:border-ink text-xs font-medium text-ink transition-colors bg-paper hover:bg-white"
                title="Sign in with Microsoft 365"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
                <span className="text-[11px] font-medium">Microsoft</span>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-ink-muted">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-bridge-teal hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive OAuth Modal */}
      <OAuthModal
        isOpen={oauthProvider !== null}
        provider={oauthProvider}
        onClose={() => setOauthProvider(null)}
      />
    </div>
  );
};
