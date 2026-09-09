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
  Sparkles,
  ShieldCheck,
  Check,
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
      portalTitle: 'student portal',
      portalSub: 'Register to access your verified career workspace',
      trustPrimary: 'AICTE Benchmark Ready',
      trustSecondary: 'Verified Portfolios',
      altText: 'Student career and learning illustration',
    },
    {
      id: 'INDUSTRY' as Role,
      title: 'Industry Recruiter',
      desc: 'Post job requirements and access ranked, pre-assessed candidates.',
      icon: Briefcase,
      portalTitle: 'recruiter portal',
      portalSub: 'Register to discover verified candidates & talent pipelines',
      trustPrimary: 'Pre-Assessed Candidates',
      trustSecondary: 'Skill Matching',
      altText: 'Industry recruiter talent discovery illustration',
    },
    {
      id: 'ACADEMICIAN' as Role,
      title: 'Academician',
      desc: 'Align course curricula with industry benchmarks and monitor cohort skill readiness.',
      icon: GraduationCap,
      portalTitle: 'faculty portal',
      portalSub: 'Register to align curricula & monitor cohort skill benchmarks',
      trustPrimary: 'Curriculum Alignment',
      trustSecondary: 'Cohort Benchmarks',
      altText: 'Academician curriculum benchmarking and teaching illustration',
    },
    {
      id: 'INSTITUTION_ADMIN' as Role,
      title: 'Institution Admin',
      desc: 'Monitor department heatmaps, placement indices, and curriculum gaps.',
      icon: Building2,
      portalTitle: 'admin portal',
      portalSub: 'Register to monitor department heatmaps & placement metrics',
      trustPrimary: 'Department Heatmaps',
      trustSecondary: 'Placement Analytics',
      altText: 'Institution administration and placement analytics illustration',
    },
  ];

  const currentRoleConfig = roleCards.find(r => r.id === selectedRole) || roleCards[0];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans flex flex-col justify-between relative overflow-hidden">
      {/* Sentry ambient cobalt spotlight */}
      <div
        className="absolute -top-32 right-0 w-[650px] h-[650px] rounded-full pointer-events-none -z-10 opacity-70 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.28) 0%, rgba(6, 182, 212, 0.10) 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute -bottom-32 left-0 w-[550px] h-[550px] rounded-full pointer-events-none -z-10 opacity-50 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(30, 64, 175, 0.20) 0%, transparent 70%)',
        }}
      />
      <div className="absolute inset-0 ascii-matrix opacity-25 pointer-events-none -z-20" />

      {/* Top Navigation */}
      <PublicNavbar />

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 relative z-10 flex flex-col justify-center">
        {/* Page Header */}
        <div className="text-center space-y-2.5 mb-7">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono tracking-wider uppercase bg-[#0b1222] border border-slate-800 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>VERIFIED WORKSPACE ONBOARDING</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Create Your SkillBridge Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Select your account type to configure your personalized, verified workspace.
          </p>
        </div>

        {/* 1. Account Type Selector Cards (Restyled with dark surfaces & blue active state) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
          {roleCards.map(rc => {
            const Icon = rc.icon;
            const isSelected = selectedRole === rc.id;

            return (
              <button
                key={rc.id}
                type="button"
                onClick={() => setSelectedRole(rc.id)}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 relative group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#0e1628] border-blue-500/80 shadow-lg shadow-blue-950/60 ring-1 ring-blue-500/40 text-white'
                    : 'bg-[#0a0f1d]/85 border-slate-800/80 hover:border-slate-700 hover:bg-[#0e1424] text-slate-400'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-blue-600/30 border border-blue-400 flex items-center justify-center">
                    <Check className="w-3 h-3 text-blue-300 stroke-[3]" />
                  </span>
                )}
                <div>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40'
                        : 'bg-[#131926] text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className={`font-bold text-sm mb-1 ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                    {rc.title}
                  </div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    {rc.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 2. Split Composed Card: Left Dark Form Area + Right Royal Blue Visual Area (Image 2 Reference) */}
        <div className="bg-[#0b101e] border border-slate-800/90 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 backdrop-blur-md">
          
          {/* LEFT SIDE: Dark Form Area (~58% on desktop) */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
            <div>
              {/* Form Title */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {currentRoleConfig.title} Registration
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Fill in the details below to complete your registration
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#131b2e] border border-slate-800 text-[11px] font-mono text-blue-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Verified</span>
                </div>
              </div>

              {/* Social Single Sign-On */}
              <div className="mt-5 space-y-3">
                <div className="text-center text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                  Sign up with single sign-on
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setOauthProvider('google')}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-800/90 hover:border-blue-500/50 text-xs font-semibold text-slate-200 transition-all bg-[#0f172a] hover:bg-[#182338] shadow-sm active:scale-[0.98]"
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
                    <span className="text-[11.5px] font-medium">Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOauthProvider('github')}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-800/90 hover:border-blue-500/50 text-xs font-semibold text-slate-200 transition-all bg-[#0f172a] hover:bg-[#182338] shadow-sm active:scale-[0.98]"
                    title="Sign up with GitHub"
                  >
                    <Github className="w-4 h-4 flex-shrink-0 text-slate-200" />
                    <span className="text-[11.5px] font-medium">GitHub</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOauthProvider('microsoft')}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-800/90 hover:border-blue-500/50 text-xs font-semibold text-slate-200 transition-all bg-[#0f172a] hover:bg-[#182338] shadow-sm active:scale-[0.98]"
                    title="Sign up with Microsoft 365"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 23 23">
                      <path fill="#f35325" d="M1 1h10v10H1z" />
                      <path fill="#81bc06" d="M12 1h10v10H12z" />
                      <path fill="#05a6f0" d="M1 12h10v10H1z" />
                      <path fill="#ffba08" d="M12 12h10v10H12z" />
                    </svg>
                    <span className="text-[11.5px] font-medium">Microsoft</span>
                  </button>
                </div>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-[10.5px] font-mono uppercase tracking-wider bg-[#0b101e] px-3 text-slate-500 font-medium">
                    or register with email
                  </div>
                </div>
              </div>

              {error && (
                <div
                  className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-medium my-4 animate-in fade-in"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Main Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4 text-xs mt-3">
                {/* 1. Student Role Fields */}
                {selectedRole === 'STUDENT' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1.5">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="e.g. Aarav Sharma"
                          required
                          className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1.5">
                          Target Engineering Domain
                        </label>
                        <select
                          value={targetDomain}
                          onChange={e => setTargetDomain(e.target.value)}
                          className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                        >
                          {domainOptions.map(d => (
                            <option key={d} value={d} className="bg-slate-900 text-white">
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        College / University Name
                      </label>
                      <UniversityAutocomplete
                        value={institution}
                        onChange={setInstitution}
                        placeholder="e.g. National Institute of Technology, Trichy"
                        required
                      />
                    </div>
                  </>
                )}

                {/* 2. Industry Recruiter Fields */}
                {selectedRole === 'INDUSTRY' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1.5">
                          Company / Entity Name
                        </label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={e => setCompanyName(e.target.value)}
                          placeholder="e.g. TechCorp Labs"
                          required
                          className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1.5">
                          Industry Sector
                        </label>
                        <input
                          type="text"
                          value={industrySector}
                          onChange={e => setIndustrySector(e.target.value)}
                          placeholder="e.g. Enterprise Cloud & AI"
                          required
                          className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        Company Size
                      </label>
                      <select
                        value={companySize}
                        onChange={e => setCompanySize(e.target.value)}
                        className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                      >
                        <option value="1-50 employees" className="bg-slate-900">1–50 employees (Early Stage)</option>
                        <option value="50-250 employees" className="bg-slate-900">50–250 employees (Growth)</option>
                        <option value="250-1000 employees" className="bg-slate-900">250–1000 employees (Scaleup)</option>
                        <option value="10,000+ employees" className="bg-slate-900">10,000+ employees (Enterprise)</option>
                      </select>
                    </div>
                  </>
                )}

                {/* 3. Academician Fields */}
                {selectedRole === 'ACADEMICIAN' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1.5">
                          Full Name &amp; Title
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="e.g. Dr. Rajeshwar Sharma"
                          required
                          className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1.5">
                          Designation
                        </label>
                        <input
                          type="text"
                          value={designation}
                          onChange={e => setDesignation(e.target.value)}
                          placeholder="e.g. Professor & HOD"
                          required
                          className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1.5">
                          Institution Name
                        </label>
                        <UniversityAutocomplete
                          value={institution}
                          onChange={setInstitution}
                          placeholder="e.g. NIT Trichy"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1.5">
                          Department
                        </label>
                        <input
                          type="text"
                          value={department}
                          onChange={e => setDepartment(e.target.value)}
                          placeholder="e.g. Computer Science"
                          required
                          className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* 4. Institution Admin Fields */}
                {selectedRole === 'INSTITUTION_ADMIN' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        Institution / University Name
                      </label>
                      <UniversityAutocomplete
                        value={institutionName}
                        onChange={setInstitutionName}
                        placeholder="e.g. Delhi Technological University"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        Admin Designation
                      </label>
                      <input
                        type="text"
                        value={adminDesignation}
                        onChange={e => setAdminDesignation(e.target.value)}
                        placeholder="e.g. Dean of Placement Cell"
                        required
                        className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Common Fields: Email and Optional Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-800/80">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="e.g. candidate@university.edu"
                        required
                        className="w-full !pl-11 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 bg-[#0f172a] border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full !pl-11 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 bg-[#0f172a] border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        required
                        className="w-full !pl-11 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 bg-[#0f172a] border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        required
                        className="w-full !pl-11 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 bg-[#0f172a] border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Primary Submit Button: Clean Royal Blue Button (Image 2 style) */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-6 rounded-xl bg-[#0a4fd6] hover:bg-[#0842b8] active:bg-[#0638a1] text-white font-semibold text-xs tracking-wide shadow-md shadow-blue-900/30 transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-blue-800/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <span className="font-mono flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating Account...</span>
                      </span>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>Create Account &amp; Start</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Bottom link to Login */}
            <div className="text-center text-xs text-slate-400 pt-3 border-t border-slate-800/60">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-blue-400 hover:text-blue-300 hover:underline ml-1">
                Sign In here
              </Link>
            </div>
          </div>

          {/* RIGHT SIDE: Rich Royal Blue Visual Area with Role-Specific Editorial Illustration */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 xl:p-10 bg-[#0a4fd6] text-white relative overflow-hidden select-none">
            {/* Organic Translucent Wave Blobs matching Image 2 */}
            <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-blue-400/25 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-blue-800/60 blur-3xl pointer-events-none" />
            
            {/* Subtle organic background curves */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
              viewBox="0 0 500 800"
              fill="none"
              preserveAspectRatio="none"
            >
              <path d="M0,0 C160,140 340,60 500,180 L500,800 L0,800 Z" fill="#042a80" />
              <path d="M0,320 C180,240 330,420 500,300 L500,800 L0,800 Z" fill="#073cb0" opacity="0.5" />
              <circle cx="430" cy="160" r="140" fill="#2563eb" opacity="0.25" />
              <circle cx="70" cy="670" r="180" fill="#021c59" opacity="0.35" />
            </svg>

            {/* Top Content: Large Bold Typography matching Image 2 */}
            <div className="relative z-10 space-y-2">
              <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-[1.15]">
                Welcome to<br />
                <span className="text-white">
                  {currentRoleConfig.portalTitle}
                </span>
              </h2>
              <p className="text-xs xl:text-sm text-blue-100/85 font-normal leading-relaxed max-w-xs">
                {currentRoleConfig.portalSub}
              </p>
            </div>

            {/* Centerpiece Vector Illustration: Role-Specific Scene */}
            <div className="relative z-10 my-4 flex items-center justify-center">
              <RoleIllustration role={selectedRole} />
            </div>

            {/* Bottom Trust Indicators */}
            <div className="relative z-10 pt-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-inner">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>{currentRoleConfig.trustPrimary}</span>
                </div>
                <div className="text-[11px] font-mono text-blue-100">
                  {currentRoleConfig.trustSecondary}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Interactive OAuth Modal (Kept 100% intact for fallback) */}
      <OAuthModal
        isOpen={oauthProvider !== null}
        provider={oauthProvider}
        onClose={() => setOauthProvider(null)}
      />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
 * ROLE-SPECIFIC EDITORIAL ILLUSTRATIONS
 * Coherent visual family: white/light surfaces, crisp #080e1a outlines,
 * blue/teal accents, drop shadow, and accessible aria-labels.
 * ───────────────────────────────────────────────────────────────────────────── */

const RoleIllustration: React.FC<{ role: Role }> = ({ role }) => {
  switch (role) {
    case 'STUDENT':
      return <StudentIllustration />;
    case 'INDUSTRY':
      return <IndustryRecruiterIllustration />;
    case 'ACADEMICIAN':
      return <AcademicianIllustration />;
    case 'INSTITUTION_ADMIN':
      return <InstitutionAdminIllustration />;
    default:
      return <StudentIllustration />;
  }
};

/**
 * 1. STUDENT REGISTRATION ILLUSTRATION
 * Theme: Learning, skill growth, portfolio development.
 */
const StudentIllustration: React.FC = () => (
  <svg
    viewBox="0 0 460 380"
    className="w-full max-w-[400px] h-auto drop-shadow-2xl"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Student career and learning illustration"
  >
    {/* Background foliage */}
    <g className="opacity-95">
      <path d="M380 345 C380 310, 420 310, 420 345 L415 358 C415 365, 385 365, 385 358 Z" fill="#080e1a" />
      <path d="M400 320 Q440 280 435 220 Q410 250 400 320 Z" fill="#ffffff" stroke="#080e1a" strokeWidth="2.5" />
      <path d="M400 320 Q470 290 455 250 Q425 285 400 320 Z" fill="#ffffff" stroke="#080e1a" strokeWidth="2.5" />
      <path d="M395 325 Q375 275 390 230 Q405 270 395 325 Z" fill="#ffffff" stroke="#080e1a" strokeWidth="2.5" />
    </g>

    {/* Stack of books and graduation cap */}
    <g id="student-books">
      <rect x="365" y="195" width="65" height="15" rx="3" fill="#ffffff" stroke="#080e1a" strokeWidth="2.5" />
      <rect x="360" y="210" width="75" height="16" rx="3" fill="#ffffff" stroke="#080e1a" strokeWidth="2.5" />
      <rect x="355" y="226" width="85" height="18" rx="3" fill="#ffffff" stroke="#080e1a" strokeWidth="2.5" />
      <path d="M397 165 L432 178 L397 191 L362 178 Z" fill="#080e1a" stroke="#080e1a" strokeWidth="2" />
      <path d="M382 185 L382 196 C382 201, 412 201, 412 196 L412 185" fill="#080e1a" />
      <path d="M432 178 L437 195" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="437" cy="197" r="2.5" fill="#ffffff" />
    </g>

    {/* Large Verified Skill Portfolio Document */}
    <g id="document-binder">
      <rect x="180" y="170" width="200" height="190" rx="14" fill="#ffffff" stroke="#080e1a" strokeWidth="3" />
      <rect x="240" y="195" width="45" height="7" rx="3.5" fill="#080e1a" />
      {/* Code badge */}
      <rect x="328" y="192" width="38" height="18" rx="5" fill="#0a4fd6" fillOpacity="0.15" stroke="#080e1a" strokeWidth="1.5" />
      <text x="334" y="205" fill="#080e1a" fontSize="10" fontFamily="monospace" fontWeight="bold">&lt;/&gt;</text>
      
      <rect x="240" y="220" width="115" height="6" rx="3" fill="#080e1a" opacity="0.8" />
      <rect x="240" y="238" width="95" height="5" rx="2.5" fill="#080e1a" opacity="0.65" />
      
      {/* Skill checklist with checkmarks */}
      <circle cx="215" cy="270" r="8" fill="none" stroke="#080e1a" strokeWidth="2.5" />
      <path d="M211 270 L214 273 L219 267" stroke="#0a4fd6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="235" y="267" width="120" height="6" rx="3" fill="#080e1a" opacity="0.75" />

      <circle cx="215" cy="296" r="8" fill="none" stroke="#080e1a" strokeWidth="2.5" />
      <path d="M211 296 L214 299 L219 293" stroke="#0a4fd6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="235" y="293" width="100" height="6" rx="3" fill="#080e1a" opacity="0.75" />

      {/* Progress bar */}
      <rect x="240" y="325" width="115" height="6" rx="3" fill="#e2e8f0" stroke="#080e1a" strokeWidth="1.5" />
      <rect x="240" y="325" width="85" height="6" rx="3" fill="#0a4fd6" />
      <rect x="240" y="342" width="70" height="5" rx="2.5" fill="#080e1a" opacity="0.5" />
    </g>

    {/* Magnifying Glass with career radar */}
    <g id="magnifying-glass">
      <circle cx="180" cy="270" r="44" fill="#0a4fd6" fillOpacity="0.18" stroke="#080e1a" strokeWidth="6" />
      <path d="M152 250 A34 34 0 0 1 198 240" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="180" cy="270" r="34" fill="none" stroke="#080e1a" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
      <path d="M180 260 L183 268 L191 268 L185 273 L187 281 L180 276 L173 281 L175 273 L169 268 L177 268 Z" fill="#ffffff" stroke="#080e1a" strokeWidth="1.5" />
    </g>

    {/* Seated Student with Laptop */}
    <g id="student-seated">
      <path d="M330 178 L375 178 L380 152 L345 152 Z" fill="#080e1a" stroke="#080e1a" strokeWidth="2" />
      <rect x="325" y="176" width="55" height="4" rx="2" fill="#080e1a" />
      <path d="M348 155 L376 155 L372 174 L344 174 Z" fill="#ffffff" />
      <path d="M312 110 C312 95, 335 95, 335 110 C335 125, 312 125, 312 110 Z" fill="#ffffff" stroke="#080e1a" strokeWidth="2.5" />
      <path d="M310 108 C310 94, 328 92, 332 98 C336 94, 338 104, 334 112 C328 108, 315 114, 310 108 Z" fill="#080e1a" />
      <circle cx="328" cy="112" r="1.5" fill="#080e1a" />
      <path d="M328 116 Q332 118 334 115" stroke="#080e1a" strokeWidth="1.5" fill="none" />
      <path d="M305 130 C310 120, 332 120, 338 130 L345 168 C340 174, 310 174, 305 168 Z" fill="#ffffff" stroke="#080e1a" strokeWidth="2.5" />
      <path d="M332 135 Q348 145 352 165" stroke="#080e1a" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M308 168 Q335 168 350 190 L370 215" stroke="#080e1a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M312 168 L330 200 L345 220" stroke="#080e1a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M368 215 C374 216, 386 220, 384 226 C376 228, 364 222, 368 215 Z" fill="#080e1a" />
      <path d="M342 220 C348 222, 360 226, 356 232 C348 234, 338 227, 342 220 Z" fill="#080e1a" />
    </g>

    {/* Standing Student with Phone & Backpack */}
    <g id="student-standing">
      <rect x="180" y="210" width="16" height="32" rx="6" fill="#080e1a" />
      <path d="M190 170 C190 156, 210 156, 210 170 C210 184, 190 184, 190 170 Z" fill="#ffffff" stroke="#080e1a" strokeWidth="2.5" />
      <path d="M188 168 C188 154, 204 152, 208 158 C212 154, 214 163, 210 171 C204 167, 193 172, 188 168 Z" fill="#080e1a" />
      <circle cx="204" cy="172" r="1.5" fill="#080e1a" />
      <path d="M185 186 C190 180, 208 180, 212 186 L216 238 L184 238 Z" fill="#ffffff" stroke="#080e1a" strokeWidth="2.5" />
      <path d="M205 195 Q218 205 212 222 L198 225" stroke="#080e1a" strokeWidth="3" strokeLinecap="round" fill="none" />
      <rect x="192" y="220" width="10" height="18" rx="2" transform="rotate(-20 192 220)" fill="#080e1a" />
      <path d="M186 195 L182 232" stroke="#080e1a" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M188 238 L175 320" stroke="#080e1a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M208 238 L225 315" stroke="#080e1a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M168 320 C175 320, 186 322, 184 330 C174 332, 160 326, 168 320 Z" fill="#080e1a" />
      <path d="M220 315 C228 316, 240 320, 238 326 C230 328, 218 322, 220 315 Z" fill="#080e1a" />
    </g>

    {/* Sparkles */}
    <g className="text-white">
      <path d="M120 140 Q125 140 125 135 Q125 140 130 140 Q125 140 125 145 Q125 140 120 140 Z" fill="#ffffff" opacity="0.75" />
      <path d="M390 130 Q394 130 394 126 Q394 130 398 130 Q394 130 394 134 Q394 130 390 130 Z" fill="#ffffff" opacity="0.6" />
      <path d="M140 340 Q143 340 143 337 Q143 340 146 340 Q143 340 143 343 Q143 340 140 340 Z" fill="#ffffff" opacity="0.7" />
    </g>
  </svg>
);

/**
 * 2. INDUSTRY RECRUITER REGISTRATION ILLUSTRATION
 * Theme: Candidate talent discovery, hiring pipeline, candidate card matching.
 */
const IndustryRecruiterIllustration: React.FC = () => (
  <svg
    viewBox="0 0 460 380"
    className="w-full max-w-[400px] h-auto drop-shadow-2xl"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Industry recruiter talent discovery illustration"
  >
    {/* Background connected candidate talent network nodes */}
    <g id="talent-network" opacity="0.6">
      <line x1="280" y1="110" x2="350" y2="90" stroke="#ffffff" strokeWidth="2" strokeDasharray="4 4" />
      <line x1="350" y1="90" x2="410" y2="125" stroke="#ffffff" strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="280" cy="110" r="16" fill="#ffffff" stroke="#080e1a" strokeWidth="2.5" />
      <circle cx="350" cy="90" r="20" fill="#ffffff" stroke="#080e1a" strokeWidth="2.5" />
      <circle cx="410" cy="125" r="15" fill="#ffffff" stroke="#080e1a" strokeWidth="2.5" />
      {/* Node silhouettes */}
      <circle cx="350" cy="85" r="5" fill="#080e1a" />
      <path d="M341 98 C341 93, 359 93, 359 98 Z" fill="#080e1a" />
    </g>

    {/* Secondary background card (tilted) */}
    <rect
      x="195"
      y="155"
      width="210"
      height="195"
      rx="14"
      transform="rotate(4 195 155)"
      fill="#0c1a33"
      stroke="#ffffff"
      strokeWidth="2"
      opacity="0.5"
    />

    {/* Main Pre-Assessed Candidate Profile Card */}
    <g id="candidate-card">
      <rect x="175" y="160" width="220" height="200" rx="14" fill="#ffffff" stroke="#080e1a" strokeWidth="3" />
      
      {/* Candidate Avatar & Badge */}
      <circle cx="215" cy="205" r="20" fill="#f1f5f9" stroke="#080e1a" strokeWidth="2.5" />
      <circle cx="215" cy="199" r="6.5" fill="#080e1a" />
      <path d="M204 217 C204 209, 226 209, 226 217 Z" fill="#080e1a" />
      
      {/* Verified green checkmark badge on avatar */}
      <circle cx="229" cy="217" r="7" fill="#10b981" stroke="#080e1a" strokeWidth="1.5" />
      <path d="M226 217 L228 219 L232 215" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Candidate Name & Domain */}
      <rect x="245" y="195" width="90" height="7" rx="3.5" fill="#080e1a" />
      <rect x="245" y="208" width="60" height="5" rx="2.5" fill="#080e1a" opacity="0.6" />

      {/* 98% Match Fulfillment Pill */}
      <rect x="315" y="193" width="70" height="20" rx="10" fill="#0a4fd6" fillOpacity="0.15" stroke="#0a4fd6" strokeWidth="1.5" />
      <text x="323" y="207" fill="#0a4fd6" fontSize="9" fontWeight="bold" fontFamily="sans-serif">98% MATCH</text>

      {/* Divider */}
      <line x1="190" y1="235" x2="380" y2="235" stroke="#e2e8f0" strokeWidth="2" />

      {/* Verified Skill Chips */}
      <text x="195" y="254" fill="#080e1a" fontSize="9" fontWeight="bold" fontFamily="monospace" letterSpacing="0.05em">VERIFIED SKILLS</text>
      <rect x="195" y="262" width="55" height="18" rx="9" fill="#080e1a" />
      <text x="205" y="274" fill="#ffffff" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">React.js</text>

      <rect x="256" y="262" width="60" height="18" rx="9" fill="#f1f5f9" stroke="#080e1a" strokeWidth="1.5" />
      <text x="265" y="274" fill="#080e1a" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">Python AI</text>

      <rect x="322" y="262" width="60" height="18" rx="9" fill="#f1f5f9" stroke="#080e1a" strokeWidth="1.5" />
      <text x="333" y="274" fill="#080e1a" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">Cloud Ops</text>

      {/* Hiring Funnel Stage Timeline */}
      <text x="195" y="304" fill="#080e1a" fontSize="8.5" fontWeight="bold" fontFamily="monospace" letterSpacing="0.05em">HIRING STAGE</text>
      <line x1="200" y1="322" x2="370" y2="322" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
      <line x1="200" y1="322" x2="310" y2="322" stroke="#0a4fd6" strokeWidth="3" strokeLinecap="round" />

      {/* Stage 1: Sourced */}
      <circle cx="200" cy="322" r="6" fill="#0a4fd6" stroke="#080e1a" strokeWidth="2" />
      {/* Stage 2: Assessed */}
      <circle cx="255" cy="322" r="6" fill="#0a4fd6" stroke="#080e1a" strokeWidth="2" />
      {/* Stage 3: Interview (Current) */}
      <circle cx="310" cy="322" r="7" fill="#ffffff" stroke="#0a4fd6" strokeWidth="3" />
      {/* Stage 4: Offer */}
      <circle cx="365" cy="322" r="5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />

      <text x="187" y="337" fill="#080e1a" fontSize="7.5" fontWeight="bold">Sourced</text>
      <text x="242" y="337" fill="#080e1a" fontSize="7.5" fontWeight="bold">Assessed</text>
      <text x="296" y="337" fill="#0a4fd6" fontSize="7.5" fontWeight="bold">Interview</text>
      <text x="355" y="337" fill="#64748b" fontSize="7.5">Offer</text>
    </g>

    {/* Talent Discovery Magnifying Radar Glass */}
    <g id="recruiter-radar">
      <circle cx="160" cy="275" r="42" fill="#0a4fd6" fillOpacity="0.18" stroke="#080e1a" strokeWidth="5" />
      <circle cx="160" cy="275" r="30" fill="none" stroke="#0a4fd6" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
      <circle cx="160" cy="275" r="16" fill="none" stroke="#080e1a" strokeWidth="1.5" />
      <path d="M160 259 L160 291" stroke="#0a4fd6" strokeWidth="1.5" opacity="0.6" />
      <path d="M144 275 L176 275" stroke="#0a4fd6" strokeWidth="1.5" opacity="0.6" />
      <path d="M130 305 L105 345" stroke="#080e1a" strokeWidth="7" strokeLinecap="round" />
    </g>

    {/* Recruiter Figure Standing on Left with Candidate Evaluation Tablet */}
    <g id="recruiter-figure">
      {/* Head & Stylized Hair */}
      <path d="M140 145 C140 130, 162 130, 162 145 C162 160, 140 160, 140 145 Z" fill="#ffffff" stroke="#080e1a" strokeWidth="2.5" />
      <path d="M138 143 C138 128, 156 126, 160 132 C164 128, 166 138, 162 146 C156 142, 143 148, 138 143 Z" fill="#080e1a" />
      <circle cx="156" cy="147" r="1.5" fill="#080e1a" />

      {/* Torso: Recruiter in Smart Suit/Blazer */}
      <path d="M130 162 C138 155, 165 155, 172 162 L176 220 L126 220 Z" fill="#ffffff" stroke="#080e1a" strokeWidth="2.5" />
      {/* Blazer lapels and necktie */}
      <path d="M145 162 L151 185 L157 162" stroke="#080e1a" strokeWidth="2" fill="none" />
      <path d="M151 175 L151 205" stroke="#0a4fd6" strokeWidth="2.5" />

      {/* Arm holding tablet */}
      <path d="M162 175 Q178 185, 172 205" stroke="#080e1a" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Tablet with candidate checkmarks */}
      <rect x="165" y="195" width="28" height="38" rx="4" fill="#ffffff" stroke="#080e1a" strokeWidth="2" transform="rotate(-10 165 195)" />
      <rect x="171" y="203" width="16" height="3" rx="1.5" fill="#0a4fd6" transform="rotate(-10 165 195)" />
      <rect x="171" y="210" width="14" height="2" rx="1" fill="#080e1a" transform="rotate(-10 165 195)" />
      <rect x="171" y="215" width="12" height="2" rx="1" fill="#080e1a" transform="rotate(-10 165 195)" />

      {/* Left arm pointing forward */}
      <path d="M135 175 Q125 190, 130 215" stroke="#080e1a" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Legs & Formal Shoes */}
      <path d="M136 220 L130 310" stroke="#080e1a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M162 220 L168 305" stroke="#080e1a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M122 310 C128 310, 140 312, 138 320 C128 322, 114 316, 122 310 Z" fill="#080e1a" />
      <path d="M162 305 C170 306, 182 310, 180 316 C172 318, 160 312, 162 305 Z" fill="#080e1a" />
    </g>

    {/* Office plant on right */}
    <g id="office-plant">
      <path d="M410 345 C410 320, 435 320, 435 345 L430 358 C430 365, 415 365, 415 358 Z" fill="#080e1a" />
      <path d="M422 325 Q445 285 435 245 Q420 275 422 325 Z" fill="#ffffff" stroke="#080e1a" strokeWidth="2" />
      <path d="M422 325 Q405 290 415 255 Q425 285 422 325 Z" fill="#ffffff" stroke="#080e1a" strokeWidth="2" />
    </g>

    {/* Sparkles */}
    <g className="text-white">
      <path d="M100 130 Q104 130 104 126 Q104 130 108 130 Q104 130 104 134 Q104 130 100 130 Z" fill="#ffffff" opacity="0.8" />
      <path d="M415 170 Q419 170 419 166 Q419 170 423 170 Q419 170 419 174 Q419 170 415 170 Z" fill="#ffffff" opacity="0.7" />
    </g>
  </svg>
);

/**
 * 3. ACADEMICIAN REGISTRATION ILLUSTRATION
 * Theme: Faculty, curriculum engineering, teaching, cohort benchmarking.
 */
const AcademicianIllustration: React.FC = () => (
  <svg
    viewBox="0 0 460 380"
    className="w-full max-w-[400px] h-auto drop-shadow-2xl"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Academician teaching and research illustration"
  >
    {/* Presentation Board / Tripod Stand behind */}
    <line x1="280" y1="330" x2="260" y2="365" stroke="#080e1a" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="280" y1="330" x2="300" y2="365" stroke="#080e1a" strokeWidth="3.5" strokeLinecap="round" />

    {/* Main Lecture / Curriculum Whiteboard */}
    <g id="curriculum-board">
      <rect x="175" y="150" width="225" height="185" rx="12" fill="#ffffff" stroke="#080e1a" strokeWidth="3" />
      
      {/* Board Header: AICTE Model Curriculum */}
      <rect x="235" y="165" width="105" height="18" rx="9" fill="#0a4fd6" fillOpacity="0.15" stroke="#0a4fd6" strokeWidth="1.5" />
      <text x="245" y="177" fill="#0a4fd6" fontSize="8" fontWeight="bold" fontFamily="monospace">CURRICULUM v2.4</text>

      {/* Flowchart Modules on Board */}
      {/* Module 1 */}
      <rect x="195" y="198" width="50" height="22" rx="5" fill="#f8fafc" stroke="#080e1a" strokeWidth="1.5" />
      <text x="202" y="212" fill="#080e1a" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Fund. DSA</text>
      
      {/* Connecting Arrow 1 */}
      <path d="M245 209 L262 209" stroke="#080e1a" strokeWidth="2" strokeLinecap="round" />
      <polygon points="262,206 267,209 262,212" fill="#080e1a" />

      {/* Module 2 */}
      <rect x="268" y="198" width="55" height="22" rx="5" fill="#0a4fd6" stroke="#080e1a" strokeWidth="1.5" />
      <text x="275" y="212" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Cloud &amp; AI</text>

      {/* Connecting Arrow 2 */}
      <path d="M323 209 L340 209" stroke="#080e1a" strokeWidth="2" strokeLinecap="round" />
      <polygon points="340,206 345,209 340,212" fill="#080e1a" />

      {/* Module 3: Industry Project */}
      <rect x="346" y="198" width="45" height="22" rx="5" fill="#f8fafc" stroke="#080e1a" strokeWidth="1.5" />
      <text x="352" y="212" fill="#080e1a" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">Capstone</text>

      {/* Curriculum Benchmarks & Cohort Review */}
      <line x1="195" y1="235" x2="380" y2="235" stroke="#e2e8f0" strokeWidth="1.5" />
      <text x="195" y="252" fill="#080e1a" fontSize="8" fontWeight="bold" fontFamily="monospace" letterSpacing="0.05em">BENCHMARKING &amp; REVIEW</text>

      {/* Formula / Outcome Line */}
      <path d="M195 272 Q240 255 285 275 T375 260" stroke="#0a4fd6" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="285" cy="275" r="4" fill="#ffffff" stroke="#080e1a" strokeWidth="2" />
      <circle cx="375" cy="260" r="4" fill="#0a4fd6" stroke="#080e1a" strokeWidth="2" />

      {/* Outcome KPI */}
      <rect x="195" y="292" width="90" height="26" rx="6" fill="#f1f5f9" stroke="#080e1a" strokeWidth="1.5" />
      <text x="202" y="303" fill="#64748b" fontSize="6.5" fontWeight="bold">INDUSTRY READINESS</text>
      <text x="202" y="314" fill="#080e1a" fontSize="9" fontWeight="extrabold">96.4% ALIGNED</text>

      <rect x="295" y="292" width="85" height="26" rx="6" fill="#f1f5f9" stroke="#080e1a" strokeWidth="1.5" />
      <text x="302" y="303" fill="#64748b" fontSize="6.5" fontWeight="bold">BENCHMARK LABS</text>
      <text x="302" y="314" fill="#0a4fd6" fontSize="9" fontWeight="extrabold">12 LAB MODULES</text>
    </g>

    {/* Graduation Cap perched on Whiteboard corner */}
    <g id="academic-cap">
      <path d="M380 135 L420 150 L380 165 L340 150 Z" fill="#080e1a" stroke="#080e1a" strokeWidth="2" />
      <path d="M365 158 L365 172 C365 178, 395 178, 395 172 L395 158" fill="#080e1a" />
      <path d="M420 150 L425 170" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="425" cy="172" r="2.5" fill="#ffffff" />
    </g>

    {/* Stack of Scholarly Volumes at base on right */}
    <g id="scholarly-books">
      <rect x="360" y="315" width="60" height="14" rx="2" fill="#ffffff" stroke="#080e1a" strokeWidth="2" />
      <rect x="355" y="329" width="70" height="15" rx="2" fill="#080e1a" />
      <rect x="350" y="344" width="80" height="16" rx="2" fill="#ffffff" stroke="#080e1a" strokeWidth="2" />
      <line x1="380" y1="315" x2="380" y2="329" stroke="#0a4fd6" strokeWidth="2" />
    </g>

    {/* Academician / Professor Standing on Left */}
    <g id="professor-figure">
      {/* Head with spectacles & academic hair */}
      <path d="M140 145 C140 130, 162 130, 162 145 C162 160, 140 160, 140 145 Z" fill="#ffffff" stroke="#080e1a" strokeWidth="2.5" />
      <path d="M138 143 C138 128, 156 126, 160 132 C164 128, 166 138, 162 146 C156 142, 143 148, 138 143 Z" fill="#080e1a" />
      {/* Spectacles */}
      <rect x="150" y="142" width="6" height="5" rx="1" fill="none" stroke="#080e1a" strokeWidth="1.5" />
      <rect x="157" y="142" width="6" height="5" rx="1" fill="none" stroke="#080e1a" strokeWidth="1.5" />
      <line x1="156" y1="144" x2="157" y2="144" stroke="#080e1a" strokeWidth="1.5" />

      {/* Academic Coat / Robe */}
      <path d="M130 162 C138 155, 165 155, 172 162 L176 230 L126 230 Z" fill="#ffffff" stroke="#080e1a" strokeWidth="2.5" />
      {/* Academic Stole */}
      <path d="M145 162 L145 220 L151 220 L151 162" fill="#0a4fd6" />
      <path d="M153 162 L153 220 L159 220 L159 162" fill="#0a4fd6" />

      {/* Arm holding pointer toward board */}
      <path d="M165 178 Q185 170, 205 185" stroke="#080e1a" strokeWidth="3" strokeLinecap="round" fill="none" />
      <line x1="205" y1="185" x2="230" y2="180" stroke="#080e1a" strokeWidth="2" strokeLinecap="round" />

      {/* Left arm holding curriculum dossier */}
      <path d="M135 178 Q125 195, 132 215" stroke="#080e1a" strokeWidth="3" strokeLinecap="round" fill="none" />
      <rect x="122" y="205" width="22" height="28" rx="3" fill="#ffffff" stroke="#080e1a" strokeWidth="2" />
      <line x1="126" y1="212" x2="138" y2="212" stroke="#080e1a" strokeWidth="1.5" />
      <line x1="126" y1="218" x2="136" y2="218" stroke="#080e1a" strokeWidth="1.5" />

      {/* Legs & Shoes */}
      <path d="M136 230 L132 315" stroke="#080e1a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M162 230 L166 312" stroke="#080e1a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M124 315 C130 315, 142 317, 140 324 C130 326, 116 320, 124 315 Z" fill="#080e1a" />
      <path d="M160 312 C168 313, 180 317, 178 323 C170 325, 158 319, 160 312 Z" fill="#080e1a" />
    </g>

    {/* Sparkles */}
    <g className="text-white">
      <path d="M100 135 Q104 135 104 131 Q104 135 108 135 Q104 135 104 139 Q104 135 100 135 Z" fill="#ffffff" opacity="0.8" />
      <path d="M400 110 Q404 110 404 106 Q404 110 408 110 Q404 110 404 114 Q404 110 400 110 Z" fill="#ffffff" opacity="0.75" />
    </g>
  </svg>
);

/**
 * 4. INSTITUTION ADMIN REGISTRATION ILLUSTRATION
 * Theme: Campus governance, placement analytics, department heatmaps, university administration.
 */
const InstitutionAdminIllustration: React.FC = () => (
  <svg
    viewBox="0 0 460 380"
    className="w-full max-w-[400px] h-auto drop-shadow-2xl"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Institution administration and placement analytics illustration"
  >
    {/* Background Campus Administration Building Silhouette */}
    <g id="campus-building" opacity="0.45">
      {/* Triangular classical pediment / roof */}
      <polygon points="310,65 375,105 245,105" fill="#ffffff" stroke="#080e1a" strokeWidth="2.5" />
      {/* Clock / university emblem */}
      <circle cx="310" cy="92" r="8" fill="#ffffff" stroke="#080e1a" strokeWidth="1.5" />
      <line x1="310" y1="88" x2="310" y2="92" stroke="#080e1a" strokeWidth="1.5" />
      <line x1="310" y1="92" x2="313" y2="92" stroke="#080e1a" strokeWidth="1.5" />

      {/* Building colonnade / pillars */}
      <rect x="252" y="105" width="116" height="50" fill="#ffffff" stroke="#080e1a" strokeWidth="2.5" />
      <line x1="268" y1="105" x2="268" y2="155" stroke="#080e1a" strokeWidth="2.5" />
      <line x1="288" y1="105" x2="288" y2="155" stroke="#080e1a" strokeWidth="2.5" />
      <line x1="310" y1="105" x2="310" y2="155" stroke="#080e1a" strokeWidth="2.5" />
      <line x1="332" y1="105" x2="332" y2="155" stroke="#080e1a" strokeWidth="2.5" />
      <line x1="352" y1="105" x2="352" y2="155" stroke="#080e1a" strokeWidth="2.5" />
    </g>

    {/* Main Institutional Analytics Dashboard Monitor */}
    <g id="admin-dashboard">
      <rect x="175" y="150" width="225" height="195" rx="14" fill="#ffffff" stroke="#080e1a" strokeWidth="3" />
      
      {/* Dashboard Topbar */}
      <rect x="195" y="165" width="55" height="7" rx="3.5" fill="#080e1a" />
      <rect x="315" y="163" width="70" height="16" rx="8" fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="1.5" />
      <text x="323" y="174" fill="#047857" fontSize="7.5" fontWeight="bold">NAAC A++ READY</text>

      {/* Placement Rate KPI Box */}
      <rect x="195" y="186" width="90" height="34" rx="8" fill="#f8fafc" stroke="#080e1a" strokeWidth="1.5" />
      <text x="203" y="198" fill="#64748b" fontSize="7" fontWeight="bold">CAMPUS PLACEMENT</text>
      <text x="203" y="213" fill="#0a4fd6" fontSize="13" fontWeight="900">94.8%</text>
      <path d="M255 204 L263 196 L271 204" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="263" y1="196" x2="263" y2="212" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />

      {/* Cohort Index KPI Box */}
      <rect x="295" y="186" width="90" height="34" rx="8" fill="#f8fafc" stroke="#080e1a" strokeWidth="1.5" />
      <text x="303" y="198" fill="#64748b" fontSize="7" fontWeight="bold">ACADEMIC COHORT</text>
      <text x="303" y="213" fill="#080e1a" fontSize="13" fontWeight="900">3,420</text>
      <text x="350" y="212" fill="#64748b" fontSize="7.5">ENROLLED</text>

      {/* Department Heatmap / Bar Chart Section */}
      <line x1="195" y1="230" x2="385" y2="230" stroke="#e2e8f0" strokeWidth="1.5" />
      
      {/* Placement Bar Chart */}
      <text x="195" y="244" fill="#080e1a" fontSize="8" fontWeight="bold" fontFamily="monospace">DEPT PLACEMENT HEATMAP</text>
      
      {/* Bars: CS, IT, ME, EC */}
      <rect x="200" y="280" width="16" height="35" rx="3" fill="#080e1a" />
      <text x="202" y="325" fill="#64748b" fontSize="7" fontWeight="bold">CS</text>

      <rect x="225" y="265" width="16" height="50" rx="3" fill="#0a4fd6" />
      <text x="228" y="325" fill="#64748b" fontSize="7" fontWeight="bold">IT</text>

      <rect x="250" y="288" width="16" height="27" rx="3" fill="#080e1a" />
      <text x="251" y="325" fill="#64748b" fontSize="7" fontWeight="bold">EC</text>

      <rect x="275" y="295" width="16" height="20" rx="3" fill="#64748b" />
      <text x="275" y="325" fill="#64748b" fontSize="7" fontWeight="bold">ME</text>

      {/* 3x3 Heatmap Grid on right */}
      <g id="heatmap-grid">
        <rect x="310" y="255" width="22" height="18" rx="4" fill="#0a4fd6" stroke="#080e1a" strokeWidth="1" />
        <rect x="335" y="255" width="22" height="18" rx="4" fill="#3b82f6" stroke="#080e1a" strokeWidth="1" />
        <rect x="360" y="255" width="22" height="18" rx="4" fill="#60a5fa" stroke="#080e1a" strokeWidth="1" />
        
        <rect x="310" y="276" width="22" height="18" rx="4" fill="#3b82f6" stroke="#080e1a" strokeWidth="1" />
        <rect x="335" y="276" width="22" height="18" rx="4" fill="#0a4fd6" stroke="#080e1a" strokeWidth="1" />
        <rect x="360" y="276" width="22" height="18" rx="4" fill="#93c5fd" stroke="#080e1a" strokeWidth="1" />

        <rect x="310" y="297" width="22" height="18" rx="4" fill="#60a5fa" stroke="#080e1a" strokeWidth="1" />
        <rect x="335" y="297" width="22" height="18" rx="4" fill="#3b82f6" stroke="#080e1a" strokeWidth="1" />
        <rect x="360" y="297" width="22" height="18" rx="4" fill="#0a4fd6" stroke="#080e1a" strokeWidth="1" />
      </g>
    </g>

    {/* Administrator / Dean Standing on Left */}
    <g id="admin-figure">
      {/* Head & Executive Hair */}
      <path d="M140 145 C140 130, 162 130, 162 145 C162 160, 140 160, 140 145 Z" fill="#ffffff" stroke="#080e1a" strokeWidth="2.5" />
      <path d="M138 143 C138 128, 156 126, 160 132 C164 128, 166 138, 162 146 C156 142, 143 148, 138 143 Z" fill="#080e1a" />
      <circle cx="156" cy="147" r="1.5" fill="#080e1a" />

      {/* Suit / Tailored Administrator Coat */}
      <path d="M130 162 C138 155, 165 155, 172 162 L176 225 L126 225 Z" fill="#ffffff" stroke="#080e1a" strokeWidth="2.5" />
      <path d="M146 162 L151 182 L156 162" stroke="#080e1a" strokeWidth="2" fill="none" />
      <circle cx="151" cy="195" r="2" fill="#080e1a" />
      <circle cx="151" cy="207" r="2" fill="#080e1a" />

      {/* Arm holding institutional clipboard */}
      <path d="M135 178 Q125 195, 130 215" stroke="#080e1a" strokeWidth="3" strokeLinecap="round" fill="none" />
      <rect x="120" y="200" width="22" height="32" rx="3" fill="#ffffff" stroke="#080e1a" strokeWidth="2" />
      <rect x="126" y="196" width="10" height="5" rx="1.5" fill="#080e1a" />
      <line x1="125" y1="208" x2="137" y2="208" stroke="#0a4fd6" strokeWidth="2" />
      <line x1="125" y1="214" x2="135" y2="214" stroke="#080e1a" strokeWidth="1.5" />
      <line x1="125" y1="220" x2="133" y2="220" stroke="#080e1a" strokeWidth="1.5" />

      {/* Right arm pointing to dashboard metrics */}
      <path d="M165 178 Q182 172, 195 190" stroke="#080e1a" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Legs & Formal Shoes */}
      <path d="M136 225 L130 315" stroke="#080e1a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M162 225 L168 310" stroke="#080e1a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M122 315 C128 315, 140 317, 138 324 C128 326, 114 320, 122 315 Z" fill="#080e1a" />
      <path d="M162 310 C170 311, 182 315, 180 321 C172 323, 160 317, 162 310 Z" fill="#080e1a" />
    </g>

    {/* Sparkles */}
    <g className="text-white">
      <path d="M100 135 Q104 135 104 131 Q104 135 108 135 Q104 135 104 139 Q104 135 100 135 Z" fill="#ffffff" opacity="0.8" />
      <path d="M415 135 Q419 135 419 131 Q419 135 423 135 Q419 135 419 139 Q419 135 415 135 Z" fill="#ffffff" opacity="0.75" />
    </g>
  </svg>
);

