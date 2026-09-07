import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  User,
  Building2,
  GraduationCap,
  Briefcase,
  Mail,
  Lock,
  Phone,
  Github,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth, getRoleRedirect } from '../context/AuthContext';
import { Role } from '@shared/types';
import { PublicNavbar } from '../components/PublicNavbar';
import { OAuthModal } from '../components/OAuthModal';
import { UniversityAutocomplete } from '../components/UniversityAutocomplete';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<Role>('STUDENT');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // OAuth Modal state
  const [oauthProvider, setOauthProvider] = useState<'google' | 'github' | 'microsoft' | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [institution, setInstitution] = useState('');
  const [targetDomain, setTargetDomain] = useState('Full-Stack Web');
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('50-250 employees');
  const [industrySector, setIndustrySector] = useState('Software & IT Platforms');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [designation, setDesignation] = useState('Associate Professor');
  const [institutionName, setInstitutionName] = useState('');
  const [adminDesignation, setAdminDesignation] = useState('Dean of Placement & Training');

  const domainOptions = [
    'Full-Stack Web',
    'AI/Data Science',
    'Cloud/DevOps',
    'UI/UX Product Design',
    'Embedded/IoT',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError(null);
    setLoading(true);

    let payload: any = {
      role: selectedRole,
      email,
      phone: phone || undefined,
      password,
    };

    if (selectedRole === 'STUDENT') {
      payload = { ...payload, name, institution, targetDomain };
    } else if (selectedRole === 'INDUSTRY') {
      payload = { ...payload, companyName, companySize, industrySector };
    } else if (selectedRole === 'ACADEMICIAN') {
      payload = { ...payload, name, institution, department, designation };
    } else if (selectedRole === 'INSTITUTION_ADMIN') {
      payload = { ...payload, institutionName, adminDesignation };
    }

    try {
      const user = await register(payload);
      const redirectPath = getRoleRedirect(user.role as Role);
      navigate(redirectPath);
    } catch (err: any) {
      const rawMsg = err.message || '';
      const isInternalError =
        rawMsg.includes('prisma') ||
        rawMsg.includes('Prisma') ||
        rawMsg.includes('DATABASE_URL') ||
        rawMsg.includes('at ') ||
        rawMsg.includes('\\') ||
        rawMsg.includes('/') ||
        rawMsg.includes('node_modules');

      setError(
        isInternalError
          ? 'Registration service is temporarily unavailable. Please try again in a moment.'
          : (rawMsg || 'Registration failed. Please review your details.')
      );
    } finally {
      setLoading(false);
    }
  };

  const roleCards = [
    {
      id: 'STUDENT' as Role,
      title: 'Student',
      desc: 'Assess skills, discover matched internships, and build verified portfolios.',
      icon: User,
      accent: 'border-bridge-teal text-bridge-teal',
    },
    {
      id: 'INDUSTRY' as Role,
      title: 'Industry Recruiter',
      desc: 'Post job requirements and access ranked, pre-assessed candidates.',
      icon: Briefcase,
      accent: 'border-industry-amber text-industry-amber',
    },
    {
      id: 'ACADEMICIAN' as Role,
      title: 'Academician',
      desc: 'Join FDPs, collaborate on research grants, and align course curricula.',
      icon: GraduationCap,
      accent: 'border-campus-blue text-campus-blue',
    },
    {
      id: 'INSTITUTION_ADMIN' as Role,
      title: 'Institution Admin',
      desc: 'Monitor department heatmaps, placement indices, and curriculum gaps.',
      icon: Building2,
      accent: 'border-status-green text-status-green',
    },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans flex flex-col justify-between relative overflow-hidden">
      {/* Sentry ambient cobalt spotlight */}
      <div
        className="absolute -top-32 right-0 w-[600px] h-[600px] rounded-full pointer-events-none -z-10 opacity-70 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, rgba(6, 182, 212, 0.10) 40%, transparent 70%)',
        }}
      />
      <div className="absolute inset-0 ascii-matrix opacity-30 pointer-events-none -z-20" />

      <PublicNavbar />

      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 my-6 relative z-10">
        <div className="text-center space-y-2.5 mb-8">
          <div className="tech-pill text-[10.5px]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>REGISTRATION PORTAL</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Create Your SkillBridge Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Select your account type to configure your personalized, verified workspace.
          </p>
        </div>

        {/* 1. Card-Based Role Selector (Traders Hub & Sentry rounded card style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {roleCards.map(rc => {
            const Icon = rc.icon;
            const isSelected = selectedRole === rc.id;

            return (
              <button
                key={rc.id}
                type="button"
                onClick={() => setSelectedRole(rc.id)}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-[#0f172a] border-cyan-500/60 shadow-lg shadow-cyan-950/40 text-white'
                    : 'bg-[#0b1222]/80 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 absolute top-3.5 right-3.5 text-cyan-400" />
                )}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                    isSelected ? 'bg-blue-600/20 text-cyan-300' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm text-white mb-1">
                  {rc.title}
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  {rc.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* 2. Registration Form */}
        <div className="bg-[#0b1222]/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-md max-w-2xl mx-auto space-y-6">
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {roleCards.find(r => r.id === selectedRole)?.title} Registration
              </h2>
              <span className="text-xs text-slate-400">
                Fill in the details below to complete your registration
              </span>
            </div>
          </div>

          {/* Quick OAuth Alternative Row */}
          <div className="space-y-3">
            <div className="text-center text-[10.5px] font-mono text-slate-500 uppercase tracking-wider font-medium">
              Sign up with single sign-on
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setOauthProvider('google')}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-800 hover:border-blue-500/60 text-xs font-semibold text-slate-200 transition-all bg-[#0f172a] hover:bg-[#1e293b]"
                title="Sign up with Google"
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
                <span className="text-[11px] font-semibold">Google</span>
              </button>

              <button
                type="button"
                onClick={() => setOauthProvider('github')}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-800 hover:border-blue-500/60 text-xs font-semibold text-slate-200 transition-all bg-[#0f172a] hover:bg-[#1e293b]"
                title="Sign up with GitHub"
              >
                <Github className="w-4 h-4 flex-shrink-0" />
                <span className="text-[11px] font-semibold">GitHub</span>
              </button>

              <button
                type="button"
                onClick={() => setOauthProvider('microsoft')}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-800 hover:border-blue-500/60 text-xs font-semibold text-slate-200 transition-all bg-[#0f172a] hover:bg-[#1e293b]"
                title="Sign up with Microsoft 365"
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

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10.5px] font-mono uppercase tracking-wider bg-[#0b1222] px-2 text-slate-500 font-medium">
                or register with email
              </div>
            </div>
          </div>

          {error && (
            <div
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 text-xs font-medium"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Student Fields */}
            {selectedRole === 'STUDENT' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      required
                      className="cyber-input w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">Target Engineering Domain</label>
                    <select
                      value={targetDomain}
                      onChange={e => setTargetDomain(e.target.value)}
                      className="cyber-input w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    >
                      {domainOptions.map(d => (
                        <option key={d} value={d} className="bg-slate-900 text-white">{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">College / University Name</label>
                  <UniversityAutocomplete
                    value={institution}
                    onChange={setInstitution}
                    placeholder="e.g. National Institute of Technology, Trichy"
                    required
                  />
                </div>
              </>
            )}

            {/* Industry Fields */}
            {selectedRole === 'INDUSTRY' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">Company / Entity Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="e.g. TechCorp Labs"
                      required
                      className="cyber-input w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">Industry Sector</label>
                    <input
                      type="text"
                      value={industrySector}
                      onChange={e => setIndustrySector(e.target.value)}
                      placeholder="e.g. Enterprise Cloud & AI"
                      required
                      className="cyber-input w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Company Size</label>
                  <select
                    value={companySize}
                    onChange={e => setCompanySize(e.target.value)}
                    className="cyber-input w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  >
                    <option value="1-50 employees" className="bg-slate-900">1–50 employees (Early Stage)</option>
                    <option value="50-250 employees" className="bg-slate-900">50–250 employees (Growth)</option>
                    <option value="250-1000 employees" className="bg-slate-900">250–1000 employees (Scaleup)</option>
                    <option value="10,000+ employees" className="bg-slate-900">10,000+ employees (Enterprise)</option>
                  </select>
                </div>
              </>
            )}

            {/* Academician Fields */}
            {selectedRole === 'ACADEMICIAN' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">Full Name & Title</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Dr. Rajeshwar Sharma"
                      required
                      className="cyber-input w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">Designation</label>
                    <input
                      type="text"
                      value={designation}
                      onChange={e => setDesignation(e.target.value)}
                      placeholder="e.g. Professor & HOD"
                      required
                      className="cyber-input w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">Institution Name</label>
                    <UniversityAutocomplete
                      value={institution}
                      onChange={setInstitution}
                      placeholder="e.g. NIT Trichy"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      placeholder="e.g. Computer Science"
                      required
                      className="cyber-input w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Institution Admin Fields */}
            {selectedRole === 'INSTITUTION_ADMIN' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Institution / University Name</label>
                  <UniversityAutocomplete
                    value={institutionName}
                    onChange={setInstitutionName}
                    placeholder="e.g. Delhi Technological University"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Admin Designation</label>
                  <input
                    type="text"
                    value={adminDesignation}
                    onChange={e => setAdminDesignation(e.target.value)}
                    placeholder="e.g. Dean of Placement Cell"
                    required
                    className="cyber-input w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
            )}

            {/* Email and Optional Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. candidate@university.edu"
                    required
                    className="cyber-input has-icon w-full !pl-11 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 bg-[#0f172a] border border-slate-800 rounded-xl focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Phone Number (Optional)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="cyber-input has-icon w-full !pl-11 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 bg-[#0f172a] border border-slate-800 rounded-xl focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                  />
                </div>
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    className="cyber-input has-icon w-full !pl-11 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 bg-[#0f172a] border border-slate-800 rounded-xl focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    required
                    className="cyber-input has-icon w-full !pl-11 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 bg-[#0f172a] border border-slate-800 rounded-xl focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cyber-btn-primary w-full py-3 rounded-full text-xs font-bold tracking-wide transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="font-mono">Creating Account...</span>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Create Account &amp; Start</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </button>
          </form>
        </div>

        <div className="text-center text-xs text-slate-400 mt-6">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-cyan-400 hover:underline">
            Sign In here
          </Link>
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
