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
  const { login, signInWithGoogle, initiateOAuth } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [coldStartNotice, setColdStartNotice] = useState(false);

  // OAuth Modal state (kept for fallback)
  const [oauthProvider, setOauthProvider] = useState<'google' | 'github' | 'microsoft' | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    setColdStartNotice(false);
    try {
      const user = await signInWithGoogle();
      const redirectPath = getRoleRedirect(user.role as Role);
      navigate(redirectPath);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github' | 'microsoft') => {
    if (provider === 'google') {
      return handleGoogleSignIn();
    }
    setError(null);
    setLoading(true);
    setColdStartNotice(false);
    try {
      await initiateOAuth(provider);
    } catch (err: any) {
      setError(err.message || `Failed to initiate sign-in with ${provider}.`);
      setLoading(false);
    }
  };

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
      const loginPromise = login(identifier.trim(), password);
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
      setError(err.message || 'Authentication failed. Please verify your login credentials.');
    } finally {
      clearTimeout(coldTimer);
      setLoading(false);
      setColdStartNotice(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans flex flex-col justify-between relative overflow-hidden">
      {/* Sentry ambient cobalt spotlight */}
      <div
        className="absolute -top-32 right-0 w-[550px] h-[550px] rounded-full pointer-events-none -z-10 opacity-70 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, rgba(6, 182, 212, 0.10) 40%, transparent 70%)',
        }}
      />
      <div className="absolute inset-0 ascii-matrix opacity-30 pointer-events-none -z-20" />

      <PublicNavbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6 relative z-10">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2.5">
            <div className="tech-pill text-[10.5px]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>VERIFIED CONSOLE ACCESS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back
            </h1>
            <p className="text-xs text-slate-400">
              Enter your credentials to access your verified career workspace.
            </p>
          </div>

          {/* Main Login Form */}
          <div className="bg-[#0b1222]/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-md space-y-5">
            {error && (
              <div
                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 text-xs font-medium"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address or Phone Number
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="e.g. name@university.edu or +91 98765 43210"
                    required
                    className="cyber-input has-icon w-full !pl-11 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 bg-[#0f172a] border border-slate-800 rounded-xl focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-mono text-cyan-400 hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="cyber-input has-icon w-full !pl-11 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 bg-[#0f172a] border border-slate-800 rounded-xl focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                  />
                </div>
              </div>

              {coldStartNotice && loading && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-950/40 border border-blue-500/40 text-cyan-400 text-xs animate-in fade-in duration-200">
                  <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
                  <span>Waking up server backend (Render cold-start)... Hang tight!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="cyber-btn-primary w-full py-3 rounded-full text-xs font-bold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="font-mono flex items-center justify-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Log in</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10.5px] font-mono uppercase tracking-wider bg-[#0b1222] px-2 text-slate-500 font-medium">
                or continue with
              </div>
            </div>

            {/* 3 OAuth Buttons: Google, GitHub, Microsoft */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                disabled={loading || googleLoading}
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-800 hover:border-blue-500/60 text-xs font-semibold text-slate-200 transition-all bg-[#0f172a] hover:bg-[#1e293b] disabled:opacity-50 disabled:cursor-not-allowed"
                title="Sign in with Google"
              >
                {googleLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                ) : (
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
                )}
                <span className="text-[11px] font-semibold">{googleLoading ? 'Signing in...' : 'Google'}</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleOAuthSignIn('github')}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-800 hover:border-blue-500/60 text-xs font-semibold text-slate-200 transition-all bg-[#0f172a] hover:bg-[#1e293b] disabled:opacity-50 disabled:cursor-not-allowed"
                title="Sign in with GitHub"
              >
                <Github className="w-4 h-4 flex-shrink-0" />
                <span className="text-[11px] font-semibold">GitHub</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleOAuthSignIn('microsoft')}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-800 hover:border-blue-500/60 text-xs font-semibold text-slate-200 transition-all bg-[#0f172a] hover:bg-[#1e293b] disabled:opacity-50 disabled:cursor-not-allowed"
                title="Sign in with Microsoft 365"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
                <span className="text-[11px] font-semibold">Microsoft</span>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-cyan-400 hover:underline">
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
