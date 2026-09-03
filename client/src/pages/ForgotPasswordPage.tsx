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
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col justify-between">
      <PublicNavbar />

      <div className="flex-1 flex items-center justify-center p-6 my-10">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-bridge-teal font-semibold">
              Account Recovery
            </span>
            <h1 className="font-serif text-3xl font-bold text-ink">
              Reset Your Password
            </h1>
            <p className="text-xs text-ink-muted">
              Enter your registered email or phone number to receive secure reset credentials.
            </p>
          </div>

          <div className="bg-white border border-line rounded-2xl p-7 shadow-campus-card space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-status-red/10 border border-status-red/20 text-status-red text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result ? (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-status-green/15 text-status-green mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="text-xs font-medium text-ink leading-relaxed">
                  {result.message}
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-ink-muted">
                  <Clock className="w-3.5 h-3.5 text-industry-amber" />
                  <span>Valid for 15 minutes</span>
                </div>

                {/* Development helper link/OTP for instant testing */}
                {result.token && (
                  <div className="p-3 bg-paper rounded-xl border border-line text-left text-xs space-y-2">
                    <div className="text-[11px] font-mono text-bridge-teal font-semibold">
                      Instant Reset Link:
                    </div>
                    <Link
                      to={`/reset-password?token=${result.token}`}
                      className="block text-xs font-mono font-bold text-campus-blue hover:underline break-all"
                    >
                      /reset-password?token={result.token}
                    </Link>
                  </div>
                )}

                {result.otp && (
                  <div className="p-3 bg-paper rounded-xl border border-line text-left text-xs space-y-2">
                    <div className="text-[11px] font-mono text-bridge-teal font-semibold">
                      Dispatched 6-digit SMS OTP:
                    </div>
                    <div className="text-sm font-mono font-bold text-ink">
                      {result.otp}
                    </div>
                    <button
                      onClick={() => navigate(`/reset-password?identifier=${encodeURIComponent(identifier)}&otp=${result.otp}`)}
                      className="w-full mt-2 py-2 px-3 rounded-lg bg-bridge-teal text-white font-semibold text-xs text-center block"
                    >
                      Proceed with this OTP →
                    </button>
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    to="/login"
                    className="inline-block text-xs font-semibold text-bridge-teal hover:underline"
                  >
                    ← Return to Sign In
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Method selector tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-paper rounded-xl border border-line">
                  <button
                    type="button"
                    onClick={() => {
                      setMethod('email');
                      setIdentifier('');
                    }}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                      method === 'email'
                        ? 'bg-white shadow-2xs text-bridge-teal font-semibold'
                        : 'text-ink-muted hover:text-ink'
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
                        ? 'bg-white shadow-2xs text-bridge-teal font-semibold'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    Via Phone (SMS OTP)
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    {method === 'email' ? 'Registered Email Address' : 'Registered Phone Number'}
                  </label>
                  <div className="relative">
                    {method === 'email' ? (
                      <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    ) : (
                      <Phone className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    )}
                    <input
                      type={method === 'email' ? 'email' : 'tel'}
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder={method === 'email' ? 'e.g. student@skillbridge.edu' : 'e.g. +91 98765 43210'}
                      required
                      className="w-full bg-paper border border-line rounded-xl pl-10 pr-4 py-2.5 text-xs text-ink focus:outline-none focus:border-bridge-teal"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-ink-muted flex items-center gap-1">
                  <Clock className="w-3 h-3 text-industry-amber" />
                  <span>Rate limited to max 3 requests per 15 minutes</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' : method === 'email' ? 'Send 15-Min Reset Link' : 'Send 6-Digit SMS OTP'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          <div className="text-center text-xs text-ink-muted">
            Remembered your credentials?{' '}
            <Link to="/login" className="font-semibold text-bridge-teal hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
