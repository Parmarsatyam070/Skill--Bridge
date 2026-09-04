import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, OAuthCallbackResult } from '../context/AuthContext';
import { Role } from '@shared/types';
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  Briefcase,
  GraduationCap,
  Building2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthCallback, completeOAuthRegistration, getRoleRedirect } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callbackResult, setCallbackResult] = useState<OAuthCallbackResult | null>(null);

  // Onboarding role state for new users
  const [selectedRole, setSelectedRole] = useState<Role>('STUDENT');
  const [roleData, setRoleData] = useState<any>({
    institution: '',
    targetDomain: 'Full-Stack Web',
    companyName: '',
    industrySector: 'Enterprise Software & Cloud Platforms',
    department: 'Computer Science & Engineering',
    designation: 'Faculty Member',
    institutionName: '',
    adminDesignation: 'Dean of Academic Relations',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error') || searchParams.get('error_description');
      const stateParam = searchParams.get('state');

      if (errorParam) {
        setError(`Authentication was cancelled or failed: ${errorParam}`);
        setLoading(false);
        return;
      }

      if (!code) {
        setError('No authorization code was returned from the OAuth provider.');
        setLoading(false);
        return;
      }

      let provider = 'google';
      if (stateParam) {
        try {
          const parsed = JSON.parse(stateParam);
          if (parsed.provider) provider = parsed.provider;
        } catch {
          if (stateParam.includes('github')) provider = 'github';
          else if (stateParam.includes('microsoft')) provider = 'microsoft';
        }
      }

      try {
        const result = await handleOAuthCallback(provider, code);
        setCallbackResult(result);

        if (!result.isNewUser && result.user) {
          // Existing user logged in successfully
          setTimeout(() => {
            navigate(getRoleRedirect(result.user!.role as Role), { replace: true });
          }, 800);
        } else {
          // New user -> stop loading and show role onboarding
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to complete OAuth authentication.');
        setLoading(false);
      }
    };

    processCallback();
  }, []);

  const handleFinishOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callbackResult?.onboardingToken) {
      setError('Onboarding session expired. Please sign in again.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const user = await completeOAuthRegistration(
        callbackResult.onboardingToken,
        selectedRole,
        roleData
      );
      navigate(getRoleRedirect(user.role as Role), { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to complete registration.');
      setSubmitting(false);
    }
  };

  const roleCards = [
    { id: 'STUDENT' as Role, title: 'Student', icon: User, desc: 'Assess skills, discover internships, build AI resume' },
    { id: 'INDUSTRY' as Role, title: 'Recruiter', icon: Briefcase, desc: 'Post openings, review verified candidates' },
    { id: 'ACADEMICIAN' as Role, title: 'Academician', icon: GraduationCap, desc: 'Map curriculum, monitor cohort gaps' },
    { id: 'INSTITUTION_ADMIN' as Role, title: 'Administrator', icon: Building2, desc: 'Institutional accreditation & metrics' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-canvas-subtle p-8 rounded-2xl border border-line max-w-md w-full space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-bridge-teal/10 border border-bridge-teal/20 text-bridge-teal flex items-center justify-center mx-auto animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <h2 className="font-serif text-xl font-bold text-ink">Verifying OAuth Credentials</h2>
          <p className="text-xs text-ink-muted leading-relaxed">
            Cryptographically validating identity tokens and establishing your secure session...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-canvas-subtle p-8 rounded-2xl border border-status-red/30 max-w-md w-full space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-status-red/10 border border-status-red/20 text-status-red flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-xl font-bold text-ink">Authentication Failed</h2>
          <p className="text-xs text-ink-muted leading-relaxed">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full py-2.5 px-4 rounded-xl bg-bridge-teal hover:bg-bridge-teal-dark text-white font-medium text-xs transition-colors shadow-sm"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // If existing user was successfully processed
  if (callbackResult && !callbackResult.isNewUser && callbackResult.user) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-canvas-subtle p-8 rounded-2xl border border-bridge-teal/30 max-w-md w-full space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-bridge-teal/10 border border-bridge-teal/20 text-bridge-teal flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-xl font-bold text-ink">Welcome Back!</h2>
          <p className="text-xs text-ink-muted leading-relaxed">
            Signed in as <span className="font-semibold text-ink">{callbackResult.user.name}</span>. Redirecting to your console...
          </p>
        </div>
      </div>
    );
  }

  // New User Onboarding Step
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="bg-canvas-subtle rounded-2xl border border-line max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-line">
          <div className="w-10 h-10 rounded-xl bg-bridge-teal/10 border border-bridge-teal/20 text-bridge-teal flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-bridge-teal font-semibold">
              Verified Identity Setup
            </span>
            <h2 className="font-serif text-xl font-bold text-ink">Welcome to SkillBridge</h2>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-paper/50 border border-line text-xs text-ink-muted flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-bridge-teal/10 text-bridge-teal flex items-center justify-center font-bold font-mono">
            {callbackResult?.profile?.name ? callbackResult.profile.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <div className="font-semibold text-ink">{callbackResult?.profile?.name}</div>
            <div className="text-[11px] font-mono text-ink-muted">{callbackResult?.profile?.email}</div>
          </div>
        </div>

        <form onSubmit={handleFinishOnboarding} className="space-y-5 text-xs font-sans">
          <div className="space-y-2">
            <label className="font-medium text-ink block">Select Your SkillBridge Role</label>
            <div className="grid grid-cols-2 gap-2.5">
              {roleCards.map(r => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRole(r.id)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-bridge-teal/10 border-bridge-teal text-ink shadow-xs'
                        : 'bg-paper/40 border-line hover:border-ink-muted/30 text-ink-muted'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-2 ${isSelected ? 'text-bridge-teal' : 'text-ink-muted'}`} />
                    <span className="font-semibold text-xs text-ink">{r.title}</span>
                    <span className="text-[10px] text-ink-muted mt-0.5 line-clamp-1">{r.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role-specific fields */}
          {selectedRole === 'STUDENT' && (
            <div className="space-y-3 p-3.5 rounded-xl bg-paper/30 border border-line">
              <div>
                <label className="text-[11px] font-medium text-ink block mb-1">College / University Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indian Institute of Technology, Delhi"
                  value={roleData.institution}
                  onChange={e => setRoleData({ ...roleData, institution: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-canvas border border-line text-ink text-xs focus:outline-none focus:border-bridge-teal"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-ink block mb-1">Primary Target Domain</label>
                <select
                  value={roleData.targetDomain}
                  onChange={e => setRoleData({ ...roleData, targetDomain: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-canvas border border-line text-ink text-xs focus:outline-none focus:border-bridge-teal"
                >
                  <option value="Full-Stack Web">Full-Stack Web</option>
                  <option value="AI/Data Science">AI/Data Science</option>
                  <option value="Cloud/DevOps">Cloud/DevOps</option>
                  <option value="UI/UX Product Design">UI/UX Product Design</option>
                  <option value="Embedded/IoT">Embedded/IoT</option>
                </select>
              </div>
            </div>
          )}

          {selectedRole === 'INDUSTRY' && (
            <div className="space-y-3 p-3.5 rounded-xl bg-paper/30 border border-line">
              <div>
                <label className="text-[11px] font-medium text-ink block mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Technologies"
                  value={roleData.companyName}
                  onChange={e => setRoleData({ ...roleData, companyName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-canvas border border-line text-ink text-xs focus:outline-none focus:border-bridge-teal"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-ink block mb-1">Industry Sector</label>
                <input
                  type="text"
                  placeholder="e.g. Cloud & Enterprise Software"
                  value={roleData.industrySector}
                  onChange={e => setRoleData({ ...roleData, industrySector: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-canvas border border-line text-ink text-xs focus:outline-none focus:border-bridge-teal"
                />
              </div>
            </div>
          )}

          {selectedRole === 'ACADEMICIAN' && (
            <div className="space-y-3 p-3.5 rounded-xl bg-paper/30 border border-line">
              <div>
                <label className="text-[11px] font-medium text-ink block mb-1">Institution & Department</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dept of CS, National Institute of Technology"
                  value={roleData.institution}
                  onChange={e => setRoleData({ ...roleData, institution: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-canvas border border-line text-ink text-xs focus:outline-none focus:border-bridge-teal"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-ink block mb-1">Faculty Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Associate Professor / Department Chair"
                  value={roleData.designation}
                  onChange={e => setRoleData({ ...roleData, designation: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-canvas border border-line text-ink text-xs focus:outline-none focus:border-bridge-teal"
                />
              </div>
            </div>
          )}

          {selectedRole === 'INSTITUTION_ADMIN' && (
            <div className="space-y-3 p-3.5 rounded-xl bg-paper/30 border border-line">
              <div>
                <label className="text-[11px] font-medium text-ink block mb-1">University / College Institution Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State Technical University"
                  value={roleData.institutionName}
                  onChange={e => setRoleData({ ...roleData, institutionName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-canvas border border-line text-ink text-xs focus:outline-none focus:border-bridge-teal"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl bg-bridge-teal hover:bg-bridge-teal-dark text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Completing Profile...</span>
              </>
            ) : (
              <>
                <span>Complete Setup & Enter Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
