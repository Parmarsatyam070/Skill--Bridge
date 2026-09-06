import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Lock, Phone, KeyRound, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { PublicNavbar } from '../components/PublicNavbar';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlToken = searchParams.get('token') || '';
  const urlIdentifier = searchParams.get('identifier') || '';
  const urlOtp = searchParams.get('otp') || '';

  const [token, setToken] = useState(urlToken);
  const [identifier, setIdentifier] = useState(urlIdentifier);
  const [otp, setOtp] = useState(urlOtp);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (urlToken) setToken(urlToken);
    if (urlIdentifier) setIdentifier(urlIdentifier);
    if (urlOtp) setOtp(urlOtp);
  }, [urlToken, urlIdentifier, urlOtp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token && (!otp || !identifier)) {
      setError('Please provide either a valid reset token or phone/email and 6-digit OTP.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/auth/reset-password', {
        token: token || undefined,
        otp: otp || undefined,
        identifier: identifier || undefined,
        password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err.message || 'Reset token or OTP is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans flex flex-col justify-between relative overflow-hidden">
      {/* Ambient Sentry-grade Cobalt Spotlight & ASCII Matrix */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none -z-10 blur-3xl opacity-35"
        style={{
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, rgba(6, 182, 212, 0.10) 40%, transparent 70%)',
        }}
      />
      <div className="absolute inset-0 ascii-matrix opacity-30 pointer-events-none -z-20" />

      <PublicNavbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-10 relative z-10">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2.5">
            <div className="tech-pill text-[10.5px]">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>CREDENTIAL RECOVERY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Choose New Password
            </h1>
            <p className="text-xs text-slate-400">
              Enter your updated secure credentials to regain console access.
            </p>
          </div>

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

            {success ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="text-base font-bold text-white">
                  Password Reset Successful!
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  All previous sessions have been invalidated. Redirecting you to sign in...
                </p>
                <Link
                  to="/login"
                  className="cyber-btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold"
                >
                  <span>Sign In Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Token or OTP/Identifier inputs */}
                {token ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                      Reset Verification Token
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={token}
                        onChange={e => setToken(e.target.value)}
                        placeholder="Paste reset token"
                        required
                        className="cyber-input has-icon w-full !pl-11 pr-4 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Registered Email or Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={identifier}
                          onChange={e => setIdentifier(e.target.value)}
                          placeholder="e.g. +91 98765 43210 or email@domain.edu"
                          required
                          className="cyber-input has-icon w-full !pl-11 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                        6-Digit SMS Verification OTP
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          maxLength={6}
                          value={otp}
                          onChange={e => setOtp(e.target.value)}
                          placeholder="e.g. 123456"
                          required
                          className="cyber-input has-icon w-full !pl-11 pr-4 py-2.5 text-xs text-cyan-300 font-mono tracking-widest font-bold placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      className="cyber-input has-icon w-full !pl-11 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      className="cyber-input has-icon w-full !pl-11 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="cyber-btn-primary w-full py-3 rounded-full text-xs font-bold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>{loading ? 'Updating Password...' : 'Save New Password & Sign In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
