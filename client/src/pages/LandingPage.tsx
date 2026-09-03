import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Radar,
  Building2,
  GraduationCap,
  Briefcase,
  Layers,
  BookOpen,
  Award,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { PublicNavbar } from '../components/PublicNavbar';
import { PublicFooter } from '../components/PublicFooter';
import { BridgeLine } from '../components/BridgeLine';

export const LandingPage: React.FC = () => {
  // Interactive Live Matching Simulator on Landing Page
  const [studentReactScore, setStudentReactScore] = useState(82);
  const [studentTsScore, setStudentTsScore] = useState(65);
  const [studentNodeScore, setStudentNodeScore] = useState(76);

  // Live calculation: weights 5, 4, 4, targets 80, 70, 70
  const simFulfillment =
    5 * Math.min(1.0, studentReactScore / 80) +
    4 * Math.min(1.0, studentTsScore / 70) +
    4 * Math.min(1.0, studentNodeScore / 70);
  const simScore = Math.round((simFulfillment / 13) * 100);
  const simTier = simScore >= 80 ? 'high' : simScore >= 50 ? 'medium' : 'low';

  return (
    <div className="min-h-screen bg-paper text-ink font-sans antialiased">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 px-6 max-w-7xl mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-bridge-teal/10 border border-bridge-teal/20 text-xs font-mono text-bridge-teal font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>National Academia–Industry Collaboration Platform</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink leading-[1.12]">
              Close the skill gap between{' '}
              <span className="text-campus-blue italic">academic learning</span> and{' '}
              <span className="text-industry-amber italic">industry demand</span>.
            </h1>

            <p className="text-base sm:text-lg text-ink-muted leading-relaxed max-w-2xl">
              SkillBridge connects Students, Industry Recruiters, Academicians, and Institutions through an authoritative server-side vector matching engine, verified NPTEL/HCL courses, and dynamic digital portfolios.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white font-semibold text-sm shadow-campus-card transition-all group"
              >
                <span>Take Standard Assessment</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-line hover:border-ink-muted text-ink font-semibold text-sm shadow-sm transition-colors"
              >
                <span>Sign In to Workspace</span>
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-line font-mono">
              <div>
                <div className="text-2xl font-bold text-ink">5 Domains</div>
                <div className="text-xs text-ink-muted font-sans mt-0.5">Industry Benchmarks</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-bridge-teal">100% Verified</div>
                <div className="text-xs text-ink-muted font-sans mt-0.5">Single Source of Truth</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-industry-amber">5 Content Partners</div>
                <div className="text-xs text-ink-muted font-sans mt-0.5">NPTEL, SWAYAM, HCL</div>
              </div>
            </div>
          </div>

          {/* Right Hero Visual Card */}
          <div className="lg:col-span-5 relative">
            <div className="bg-console-bg text-console-text rounded-2xl p-6 shadow-2xl border border-console-border relative z-10">
              <div className="flex items-center justify-between pb-4 border-b border-console-border mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-status-green" />
                  <span className="font-mono text-xs text-console-text font-semibold">
                    Live Vector Match Engine
                  </span>
                </div>
                <span className="text-[10px] font-mono text-console-text-muted px-2 py-0.5 rounded bg-console-panel">
                  Server Computed
                </span>
              </div>

              {/* Signature Bridge Line Demonstration */}
              <BridgeLine
                sourceLabel="React.js (82%) + Node.js (76%)"
                targetLabel="TechCorp Full-Stack Intern"
                matchScore={simScore}
                tier={simTier}
                className="mb-4"
              />

              {/* Interactive Sliders to test match recalculation */}
              <div className="space-y-3.5 bg-console-panel p-4 rounded-xl border border-console-border">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-console-text-muted">React.js Competency</span>
                  <span className="text-bridge-teal font-bold">{studentReactScore}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={studentReactScore}
                  onChange={e => setStudentReactScore(Number(e.target.value))}
                  className="w-full accent-bridge-teal cursor-pointer"
                />

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-console-text-muted">TypeScript Competency</span>
                  <span className="text-industry-amber font-bold">{studentTsScore}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={studentTsScore}
                  onChange={e => setStudentTsScore(Number(e.target.value))}
                  className="w-full accent-industry-amber cursor-pointer"
                />

                <div className="pt-2 flex items-center justify-between text-xs border-t border-console-border/60">
                  <span className="text-[11px] text-console-text-muted">Live Match Outcome:</span>
                  <span className={`font-mono font-bold text-sm ${simScore >= 80 ? 'text-status-green' : 'text-status-amber'}`}>
                    {simScore}% ({simScore >= 80 ? 'Fast-Track High Match' : 'Good Fit / Up-skill'})
                  </span>
                </div>
              </div>
            </div>

            {/* Decorative background glow */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-campus-blue/20 via-bridge-teal/20 to-industry-amber/20 rounded-3xl blur-2xl -z-10" />
          </div>
        </div>
      </section>

      {/* 4 Persona Feature Pillars */}
      <section id="features" className="py-20 px-6 bg-white border-y border-line">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-bridge-teal font-semibold">
              Unified Ecosystem
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink">
              Four stakeholders. One connected platform.
            </h2>
            <p className="text-sm text-ink-muted">
              Built ground-up with specialized workflows for every participant in the career lifecycle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Persona 1: Students */}
            <div className="p-6 rounded-2xl bg-paper border border-line hover:border-bridge-teal transition-all space-y-4 shadow-sm group">
              <div className="w-12 h-12 rounded-xl bg-bridge-teal/10 text-bridge-teal flex items-center justify-center">
                <Radar className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-ink">For Students</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Take standardized domain assessments, see verified skill radar gaps, complete accredited NPTEL/HCL courses, and export ATS-optimized resumes.
              </p>
              <Link to="/register" className="inline-flex items-center gap-1.5 text-xs font-semibold text-bridge-teal group-hover:underline">
                <span>Start Skill Assessment</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Persona 2: Industry */}
            <div className="p-6 rounded-2xl bg-paper border border-line hover:border-industry-amber transition-all space-y-4 shadow-sm group">
              <div className="w-12 h-12 rounded-xl bg-industry-amber/10 text-industry-amber flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-ink">For Industry</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Post internships with custom skill weights, review verified applicant rankings with zero resume fraud, and discover pre-assessed talent.
              </p>
              <Link to="/register" className="inline-flex items-center gap-1.5 text-xs font-semibold text-industry-amber group-hover:underline">
                <span>Post Requirements</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Persona 3: Academician */}
            <div className="p-6 rounded-2xl bg-paper border border-line hover:border-campus-blue transition-all space-y-4 shadow-sm group">
              <div className="w-12 h-12 rounded-xl bg-campus-blue/10 text-campus-blue flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-ink">For Academicians</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Discover AICTE-HCL faculty development programs, apply for joint research grants, and update university curricula with industry data.
              </p>
              <Link to="/register" className="inline-flex items-center gap-1.5 text-xs font-semibold text-campus-blue group-hover:underline">
                <span>Explore FDPs & Grants</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Persona 4: Institution */}
            <div className="p-6 rounded-2xl bg-paper border border-line hover:border-status-green transition-all space-y-4 shadow-sm group">
              <div className="w-12 h-12 rounded-xl bg-status-green/10 text-status-green flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-ink">For Institutions</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                View real-time batch skill heatmaps, track placement readiness indices, and identify syllabus gaps lagging behind industry benchmarks.
              </p>
              <Link to="/register" className="inline-flex items-center gap-1.5 text-xs font-semibold text-status-green group-hover:underline">
                <span>View Analytics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Content Partners Section */}
      <section id="partners" className="py-20 px-6 max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-campus-blue font-semibold">
            Accredited Content Partners
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
            Directly mapped to accredited learning platforms
          </h3>
          <p className="text-xs text-ink-muted max-w-xl mx-auto">
            SkillBridge integrates real, publicly cataloged courses from premier academic and industry partners to close verified competency gaps.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
          {[
            { name: 'NPTEL (IITs & IISc)', type: 'National MOOC', count: '100+ Courses' },
            { name: 'SWAYAM', type: 'Govt of India', count: 'Accredited' },
            { name: 'HCL TechBee & GUVI', type: 'Industry Hiring', count: 'Verified Labs' },
            { name: 'Coursera', type: 'Global Certs', count: 'Enterprise' },
            { name: 'upGrad', type: 'Advanced Tech', count: 'Cloud & AI' },
          ].map((p, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-white border border-line text-center space-y-1 shadow-sm">
              <div className="text-xs font-mono text-bridge-teal font-semibold">{p.type}</div>
              <div className="font-serif font-bold text-sm text-ink">{p.name}</div>
              <div className="text-[11px] text-ink-muted">{p.count}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Conversion CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-campus-blue via-[#1f375b] to-console-bg text-white text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold">
            Ready to bridge academic potential with industry careers?
          </h2>
          <p className="text-sm text-white/80 leading-relaxed">
            Create an account in seconds. Test real matching algorithms, evaluate skill gap radars, and access verified internship opportunities.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white text-sm font-semibold shadow-lg transition-all"
            >
              Sign Up as Student
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-industry-amber hover:bg-industry-amber/90 text-white text-sm font-semibold shadow-lg transition-all"
            >
              Sign Up as Recruiter
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
