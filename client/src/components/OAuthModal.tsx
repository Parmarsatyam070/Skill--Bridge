import React, { useState } from 'react';
import { X, ArrowRight, User, Briefcase, GraduationCap, Building2, AlertCircle } from 'lucide-react';
import { useAuth, getRoleRedirect } from '../context/AuthContext';
import { Role } from '@shared/types';
import { useNavigate } from 'react-router-dom';

interface OAuthModalProps {
  isOpen: boolean;
  provider: 'google' | 'github' | 'microsoft' | null;
  onClose: () => void;
}

export const OAuthModal: React.FC<OAuthModalProps> = ({ isOpen, provider, onClose }) => {
  const { oauthLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'verify' | 'select_role'>('verify');
  const [selectedRole, setSelectedRole] = useState<Role>('STUDENT');
  const [roleData, setRoleData] = useState<any>({
    institution: '',
    targetDomain: 'Full-Stack Web',
    companyName: '',
    industrySector: 'Enterprise Software & Cloud Platforms',
    department: 'Computer Science & Engineering',
    designation: 'Associate Professor',
    institutionName: '',
    adminDesignation: 'Dean of Academic Relations',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !provider) return null;

  const getProviderDetails = () => {
    switch (provider) {
      case 'google':
        return {
          title: 'Sign in with Google',
          color: 'text-[#4285F4]',
          domainHint: 'e.g. yourname@gmail.com or @university.edu',
        };
      case 'github':
        return {
          title: 'Sign in with GitHub',
          color: 'text-gray-900',
          domainHint: 'e.g. developer@github.com',
        };
      case 'microsoft':
        return {
          title: 'Sign in with Microsoft 365',
          color: 'text-[#00A4EF]',
          domainHint: 'e.g. student@institution.ac.in',
        };
    }
  };

  const providerDetails = getProviderDetails();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your account email address.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await oauthLogin({
        provider,
        email,
        name: name || email.split('@')[0],
      });

      if (res.requiresRoleSelection) {
        setStep('select_role');
      } else if (res.user) {
        onClose();
        navigate(getRoleRedirect(res.user.role as Role));
      }
    } catch (err: any) {
      setError(err.message || 'OAuth verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await oauthLogin({
        provider,
        email,
        name: name || email.split('@')[0],
        role: selectedRole,
        roleData,
      });

      if (res.user) {
        onClose();
        navigate(getRoleRedirect(res.user.role as Role));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  const roleCards = [
    { id: 'STUDENT' as Role, title: 'Student', icon: User },
    { id: 'INDUSTRY' as Role, title: 'Industry Recruiter', icon: Briefcase },
    { id: 'ACADEMICIAN' as Role, title: 'Academician', icon: GraduationCap },
    { id: 'INSTITUTION_ADMIN' as Role, title: 'Institution Admin', icon: Building2 },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-line max-w-md w-full p-6 shadow-2xl space-y-5 relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-bridge-teal font-semibold">
              Verified OAuth 2.0
            </span>
            <h3 className="font-serif text-lg font-bold text-ink">{providerDetails.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-paper transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-status-red/10 border border-status-red/20 text-status-red text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'verify' ? (
          <form onSubmit={handleVerify} className="space-y-4 text-xs font-sans">
            <p className="text-ink-muted leading-relaxed">
              Authenticate using your verified <strong>{providerDetails.title}</strong> account. Existing accounts will be logged in immediately.
            </p>

            <div>
              <label className="block font-semibold text-ink mb-1.5">Provider Verified Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={providerDetails.domainHint}
                required
                className="w-full bg-paper border border-line rounded-xl px-3.5 py-2.5 text-xs text-ink focus:outline-none focus:border-bridge-teal"
              />
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1.5">Full Name (from Provider)</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Your Name"
                className="w-full bg-paper border border-line rounded-xl px-3.5 py-2.5 text-xs text-ink focus:outline-none focus:border-bridge-teal"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Verifying Account...' : 'Continue with ' + provider.toUpperCase()}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleCompleteRegistration} className="space-y-4 text-xs font-sans">
            <div className="space-y-1">
              <h4 className="font-serif font-bold text-ink">Select Account Type</h4>
              <p className="text-[11px] text-ink-muted">
                Since this is your first time signing in with {email}, choose your role to configure your workspace.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {roleCards.map(rc => {
                const Icon = rc.icon;
                const isSelected = selectedRole === rc.id;
                return (
                  <button
                    key={rc.id}
                    type="button"
                    onClick={() => setSelectedRole(rc.id)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'border-bridge-teal bg-bridge-teal/10 font-semibold text-ink'
                        : 'border-line hover:border-ink-muted bg-paper text-ink-muted'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-bridge-teal" />
                    <span className="text-xs">{rc.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Role specific inputs */}
            {selectedRole === 'STUDENT' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block font-semibold text-ink mb-1">University / College</label>
                  <input
                    type="text"
                    value={roleData.institution}
                    onChange={e => setRoleData({ ...roleData, institution: e.target.value })}
                    placeholder="e.g. NIT Trichy / DTU"
                    required
                    className="w-full bg-paper border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-bridge-teal"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Target Engineering Domain</label>
                  <select
                    value={roleData.targetDomain}
                    onChange={e => setRoleData({ ...roleData, targetDomain: e.target.value })}
                    className="w-full bg-paper border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-bridge-teal"
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
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block font-semibold text-ink mb-1">Company / Entity Name</label>
                  <input
                    type="text"
                    value={roleData.companyName}
                    onChange={e => setRoleData({ ...roleData, companyName: e.target.value })}
                    placeholder="e.g. TechCorp Labs"
                    required
                    className="w-full bg-paper border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-bridge-teal"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Industry Sector</label>
                  <input
                    type="text"
                    value={roleData.industrySector}
                    onChange={e => setRoleData({ ...roleData, industrySector: e.target.value })}
                    placeholder="e.g. Enterprise Cloud & Software"
                    required
                    className="w-full bg-paper border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-bridge-teal"
                  />
                </div>
              </div>
            )}

            {selectedRole === 'ACADEMICIAN' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block font-semibold text-ink mb-1">Institution Name</label>
                  <input
                    type="text"
                    value={roleData.institution}
                    onChange={e => setRoleData({ ...roleData, institution: e.target.value })}
                    placeholder="e.g. IIT Roorkee"
                    required
                    className="w-full bg-paper border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-bridge-teal"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Department</label>
                  <input
                    type="text"
                    value={roleData.department}
                    onChange={e => setRoleData({ ...roleData, department: e.target.value })}
                    placeholder="e.g. Computer Science & Engineering"
                    required
                    className="w-full bg-paper border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-bridge-teal"
                  />
                </div>
              </div>
            )}

            {selectedRole === 'INSTITUTION_ADMIN' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block font-semibold text-ink mb-1">Institution / University Name</label>
                  <input
                    type="text"
                    value={roleData.institutionName}
                    onChange={e => setRoleData({ ...roleData, institutionName: e.target.value })}
                    placeholder="e.g. Delhi Technological University"
                    required
                    className="w-full bg-paper border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-bridge-teal"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Admin Designation</label>
                  <input
                    type="text"
                    value={roleData.adminDesignation}
                    onChange={e => setRoleData({ ...roleData, adminDesignation: e.target.value })}
                    placeholder="e.g. Dean of Academic Relations"
                    required
                    className="w-full bg-paper border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-bridge-teal"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white font-semibold text-xs shadow-sm transition-all mt-4 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Complete OAuth Setup & Enter'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
