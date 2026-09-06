import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, ArrowRight, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { PublicNavbar } from '../components/PublicNavbar';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; mode?: string; token?: string; otp?: string; resetUrl?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.post<any>('/auth/forgot-password', {
        identifier: identifier.trim(),
        [method]: identifier.trim(),
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Could not process password reset request.');
    } finally {
      setLoading(false);
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

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-10 relative z-10">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2.5">
            <div className="tech-pill text-[10.5px]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>ACCOUNT RECOVERY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Reset Your Password
            </h1>
            <p className="text-xs text-slate-400">
              Enter your registered email or phone number to receive secure reset credentials.
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

            {result ? (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="text-xs font-medium text-slate-200 leading-relaxed">
                  {result.message}
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Valid for 15 minutes</span>
                </div>

                {result.token && (
                  <div className="p-3.5 bg-[#0f172a] rounded-xl border border-slate-800 text-left text-xs space-y-2">
                    <div className="text-[11px] font-mono text-cyan-400 font-semibold">
                      Instant Reset Link:
                    </div>
                    <Link
                      to={`/reset-password?token=${result.token}`}
                      className="block text-xs font-mono font-bold text-blue-400 hover:underline break-all"
                    >
                      /reset-password?token={result.token}
                    </Link>
                  </div>
                )}

                {result.otp && (
                  <div className="p-3.5 bg-[#0f172a] rounded-xl border border-slate-800 text-left text-xs space-y-2">
                    <div className="text-[11px] font-mono text-cyan-400 font-semibold">
                      Dispatched 6-digit SMS OTP:
                    </div>
                    <div className="text-sm font-mono font-bold text-white">
                      {result.otp}
                    </div>
                    <button
                      onClick={() => navigate(`/reset-password?identifier=${encodeURIComponent(identifier)}&otp=${result.otp}`)}
                      className="cyber-btn-primary w-full mt-2 py-2 px-3 text-xs"
                    >
                      Proceed with this OTP →
                    </button>
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    to="/login"
                    className="inline-block text-xs font-semibold text-cyan-400 hover:underline"
                  >
                    ← Return to Sign In
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Method selector tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#0f172a] rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setMethod('email');
                      setIdentifier('');
                    }}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                      method === 'email'
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Via Email
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMethod('phone');
                      setIdentifier('');
                    }}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                      method === 'phone'
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Via Phone (SMS OTP)
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {method === 'email' ? 'Registered Email Address' : 'Registered Phone Number'}
                  </label>
                  <div className="relative">
                    {method === 'email' ? (
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    ) : (
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                    <input
                      type={method === 'email' ? 'email' : 'tel'}
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder={method === 'email' ? 'e.g. student@skillbridge.edu' : 'e.g. +91 98765 43210'}
                      required
                      className="cyber-input has-icon w-full bg-[#0f172a] border border-slate-800 rounded-xl !pl-11 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Rate limited to max 3 requests per 15 minutes</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="cyber-btn-primary w-full py-3 rounded-full text-xs font-bold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>{loading ? 'Processing...' : method === 'email' ? 'Send 15-Min Reset Link' : 'Send 6-Digit SMS OTP'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              </form>
            )}
          </div>

          <div className="text-center text-xs text-slate-400">
            Remembered your credentials?{' '}
            <Link to="/login" className="font-semibold text-cyan-400 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
