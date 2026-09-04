import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Lock, Phone, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
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

  const isTokenMode = !!token || (!identifier && !otp);

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
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col justify-between">
      <PublicNavbar />

      <div className="flex-1 flex items-center justify-center p-6 my-10">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-bridge-teal font-semibold">
              Create New Password
            </span>
            <h1 className="font-serif text-3xl font-bold text-ink">
              Choose New Password
            </h1>
            <p className="text-xs text-ink-muted">
              Enter your updated secure credentials to regain console access.
            </p>
          </div>

          <div className="bg-white border border-line rounded-2xl p-7 shadow-campus-card space-y-5">
            {error && (
              <div
                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-status-red/10 border border-status-red/30 text-status-red text-xs font-medium"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {success ? (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-status-green/15 text-status-green mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="font-serif text-lg font-bold text-ink">
                  Password Reset Successful!
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  All previous sessions have been invalidated. Redirecting you to sign in...
                </p>
                <Link
                  to="/login"
                  className="inline-block px-4 py-2.5 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white text-xs font-bold shadow-md transition-all"
                >
                  Sign In Now
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Token or OTP/Identifier inputs */}
                {token ? (
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1.5">
                      Reset Verification Token
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={token}
                        onChange={e => setToken(e.target.value)}
                        placeholder="Paste reset token"
                        required
                        className="w-full bg-paper border border-line rounded-xl pl-10 pr-4 py-2 text-xs text-ink font-mono placeholder:text-ink-muted focus:outline-none focus:border-bridge-teal focus:ring-1 focus:ring-bridge-teal transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1.5">
                        Registered Email or Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={identifier}
                          onChange={e => setIdentifier(e.target.value)}
                          placeholder="e.g. +91 98765 43210 or email@domain.edu"
                          required
                          className="w-full bg-paper border border-line rounded-xl pl-10 pr-4 py-2 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-bridge-teal focus:ring-1 focus:ring-bridge-teal transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1.5">
                        6-Digit SMS Verification OTP
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          maxLength={6}
                          value={otp}
                          onChange={e => setOtp(e.target.value)}
                          placeholder="e.g. 123456"
                          required
                          className="w-full bg-paper border border-line rounded-xl pl-10 pr-4 py-2 text-xs text-ink font-mono tracking-widest font-bold placeholder:text-ink-muted focus:outline-none focus:border-bridge-teal focus:ring-1 focus:ring-bridge-teal transition-all"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      className="w-full bg-paper border border-line rounded-xl pl-10 pr-4 py-2.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-bridge-teal focus:ring-1 focus:ring-bridge-teal transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      className="w-full bg-paper border border-line rounded-xl pl-10 pr-4 py-2.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-bridge-teal focus:ring-1 focus:ring-bridge-teal transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 active:bg-[#20635c] text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-bridge-teal"
                >
                  {loading ? 'Updating Password...' : 'Save New Password & Sign In'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
