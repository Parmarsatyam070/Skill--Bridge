import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Radar,
  Briefcase,
  GraduationCap,
  Building2,
  ChevronRight,
  Zap,
  ShieldCheck,
  BarChart3,
  Cpu,
  CheckCircle2,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { PublicNavbar } from '../components/PublicNavbar';
import { PublicFooter } from '../components/PublicFooter';
import { BridgeLine } from '../components/BridgeLine';

/* ─── Cyber-Luminescent Obsidian Design Tokens ────────────────────────────── */
const C = {
  canvas:     '#030712',
  surface1:   '#0b1222',
  surface2:   '#0f172a',
  surface3:   '#172554',
  hairline:   '#1e293b',
  hairlineH:  '#334155',
  primary:    '#2563eb',
  primaryH:   '#3b82f6',
  cyan:       '#06b6d4',
  emerald:    '#10b981',
  ink:        '#f8fafc',
  inkMuted:   '#cbd5e1',
  inkSubtle:  '#94a3b8',
} as const;

export const LandingPage: React.FC = () => {
  /* Interactive match simulator */
  const [reactScore, setReactScore] = useState(84);
  const [tsScore,    setTsScore]    = useState(70);
  const [nodeScore,  setNodeScore]  = useState(78);

  const simFulfillment =
    5 * Math.min(1.0, reactScore / 80) +
    4 * Math.min(1.0, tsScore    / 70) +
    4 * Math.min(1.0, nodeScore  / 70);
  const simScore = Math.round((simFulfillment / 13) * 100);
  const simTier  = simScore >= 80 ? 'high' : simScore >= 50 ? 'medium' : 'low';

  return (
    <div
      className="min-h-screen font-sans antialiased text-slate-100 overflow-x-hidden"
      style={{ background: C.canvas }}
    >
      <PublicNavbar />

      {/* ── HERO SECTION: SENTRY AMBIENT SPOTLIGHT + ZK.LINK CONSTELLATION ── */}
      <section className="relative pt-10 sm:pt-14 md:pt-20 pb-14 sm:pb-18 md:pb-24 px-4 sm:px-6 max-w-[1280px] mx-auto overflow-hidden">
        {/* Ambient Electric Cobalt Radial Spotlight (Reference 4: Sentry) */}
        <div
          className="absolute -top-32 right-0 w-[550px] sm:w-[750px] h-[550px] sm:h-[750px] rounded-full pointer-events-none -z-10 opacity-70 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.28) 0%, rgba(6, 182, 212, 0.12) 40%, transparent 70%)',
          }}
        />

        {/* Subtle ASCII / Dot-Matrix Grid Texture (Reference 3: Creation of Adam) */}
        <div className="absolute inset-0 ascii-matrix opacity-40 pointer-events-none -z-20" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">

          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">

            {/* Sentry-style Monospace Verification Chips (Reference 4) */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="tech-pill">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>AICTE ALIGNED</span>
              </div>
              <div className="tech-pill tech-pill-active">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span>STATUS: ■ LIVE MONITORING</span>
              </div>
            </div>

            {/* Display Headline */}
            <h1
              className="font-sans font-bold leading-[1.06] tracking-tight text-white"
              style={{
                fontSize: 'clamp(34px, 5.8vw, 70px)',
                letterSpacing: '-2.2px',
              }}
            >
              Built for Talent.{' '}
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #60a5fa 0%, #38bdf8 50%, #2563eb 100%)',
                }}
              >
                Trusted Nationwide.
              </span>
            </h1>

            <p
              className="text-base sm:text-lg max-w-[560px] leading-relaxed"
              style={{ color: C.inkMuted }}
            >
              SkillBridge connects Students, Recruiters, Academicians, and Institutions through server-side vector matching, verified NPTEL/HCL certifications, and zero-bias skill telemetry.
            </p>

            {/* Luminous Pill CTAs (Reference 1 & 4) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Link
                to="/register"
                className="cyber-btn-primary type-button text-sm sm:text-base py-3 px-7 group"
              >
                <span>Take Standard Assessment</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="cyber-btn-secondary type-button text-sm sm:text-base py-3 px-6"
              >
                Sign In to Workspace
              </Link>
            </div>

            {/* Real-time Telemetry strip */}
            <div
              className="grid grid-cols-3 gap-4 sm:gap-6 pt-6 border-t font-mono"
              style={{ borderColor: C.hairline }}
            >
              {[
                { value: '5 Domains',     label: 'Industry Benchmarks',  color: '#60a5fa' },
                { value: '100% Audited',  label: 'Deterministic Vector', color: C.cyan    },
                { value: '5 Partners',    label: 'NPTEL · SWAYAM · HCL', color: C.emerald },
              ].map(m => (
                <div key={m.label}>
                  <div className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-xs mt-1 font-sans text-slate-400">{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Hero Column — Sentry / zk.Link Benchmarking Stage */}
          <div className="lg:col-span-5">
            <div
              className="rounded-3xl p-5 sm:p-6 border relative overflow-hidden backdrop-blur-md"
              style={{
                background: 'rgba(11, 18, 34, 0.85)',
                borderColor: 'rgba(59, 130, 246, 0.3)',
                boxShadow: '0 20px 50px -10px rgba(37, 99, 235, 0.25)',
              }}
            >
              {/* Subtle top edge photonic glow */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />

              {/* Card header */}
              <div
                className="flex items-center justify-between pb-3.5 mb-4 border-b"
                style={{ borderColor: C.hairline }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-mono text-xs font-semibold text-slate-200 tracking-wide">
                    VECTOR MATCH ENGINE
                  </span>
                </div>
                <span className="tech-pill text-[10px] py-0.5 px-2 text-cyan-300">
                  SERVER COMPUTED
                </span>
              </div>

              {/* Dynamic Bridge Line Component */}
              <BridgeLine
                sourceLabel={`Candidate Vector (${simScore}%)`}
                targetLabel="TechCorp Full-Stack Intern"
                matchScore={simScore}
                tier={simTier}
                className="mb-4"
              />

              {/* Sliders in elevated panel */}
              <div
                className="space-y-3.5 p-4 rounded-2xl border"
                style={{ background: '#0f172a', borderColor: C.hairline }}
              >
                {[
                  { label: 'React.js Competency',   val: reactScore, set: setReactScore, color: '#3b82f6', min: 30 },
                  { label: 'TypeScript Systems',    val: tsScore,    set: setTsScore,    color: '#06b6d4', min: 20 },
                  { label: 'Node.js Architecture',  val: nodeScore,  set: setNodeScore,  color: '#8b5cf6', min: 20 },
                ].map(({ label, val, set, color, min }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between font-mono mb-1 text-xs">
                      <span className="text-slate-400">{label}</span>
                      <span className="font-bold" style={{ color }}>{val}%</span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={100}
                      value={val}
                      onChange={e => set(Number(e.target.value))}
                      className="w-full cursor-pointer h-1.5 rounded-lg bg-slate-800 accent-blue-500"
                    />
                  </div>
                ))}

                <div
                  className="pt-2.5 flex items-center justify-between border-t"
                  style={{ borderColor: C.hairline }}
                >
                  <span className="text-xs text-slate-400">Match Fulfillment:</span>
                  <span
                    className="font-mono font-bold text-xs sm:text-sm"
                    style={{ color: simScore >= 80 ? C.emerald : '#f59e0b' }}
                  >
                    {simScore}% • {simScore >= 80 ? 'Priority Interview Tier' : 'Accredited Pathway'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sentry-Style Trusted Partners Ticker (Reference 4) */}
        <div className="mt-14 sm:mt-18 pt-6 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            TRUSTED BY NATIONAL BENCHMARKS & CAMPUS TEAMS
          </span>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-slate-400 font-mono text-xs sm:text-sm font-semibold tracking-wider">
            <span className="hover:text-white transition-colors">▲ AICTE</span>
            <span className="hover:text-white transition-colors">NPTEL</span>
            <span className="hover:text-white transition-colors">SWAYAM</span>
            <span className="hover:text-white transition-colors">HCL GUVI</span>
            <span className="hover:text-white transition-colors">VERCEL</span>
            <span className="hover:text-white transition-colors">CURSOR</span>
          </div>
        </div>
      </section>

      {/* ── TRADERS HUB 3-CARD SHOWCASE SECTION (Reference 1) ───────────────── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 border-y border-slate-800/80 bg-[#060b18]/60 relative">
        <div className="max-w-[1280px] mx-auto space-y-10">

          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="tech-pill text-xs">
              CORE INFRASTRUCTURE
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Focused on reliability, regulation, and real local support
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Built on transparent mathematical algorithms, national compliance frameworks, and verified talent pipelines.
            </p>
          </div>

          {/* 3 Showcase Cards (Exact Layout of Traders Hub Reference 1) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1: Regulated & Licensed (Clean Light/Contrast Panel) */}
            <div className="rounded-3xl p-7 border border-slate-700/60 bg-gradient-to-b from-slate-900/90 to-slate-950 flex flex-col justify-between min-h-[340px] relative overflow-hidden group hover:border-blue-500/50 transition-all">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
                    Accredited &amp; Regulated
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Fully compliant under AICTE regulation and national standards. Candidate competency vectors are immutable.
                  </p>
                </div>
              </div>
              <div className="pt-6 flex items-center justify-between">
                <Link
                  to="/register"
                  className="cyber-btn-primary type-button text-xs py-2 px-5"
                >
                  Start Assessment
                </Link>
                <span className="text-[11px] font-mono text-slate-500">AICTE PASS</span>
              </div>
            </div>

            {/* Card 2: Vector Support, 24/7 (Emerald/Teal Wave Aesthetic) */}
            <div
              className="rounded-3xl p-7 border border-teal-500/30 flex flex-col justify-between min-h-[340px] relative overflow-hidden group hover:border-teal-400/60 transition-all"
              style={{
                background: 'linear-gradient(160deg, #062726 0%, #031518 50%, #030712 100%)',
              }}
            >
              {/* Subtle wave mesh */}
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:16px_16px]" />

              <div className="space-y-4 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
                    Deterministic Engine, 24/7
                  </h3>
                  <p className="text-sm text-teal-100/70 leading-relaxed">
                    Evaluated with verified domain algorithms. No black-box AI hallucinations. Zero bias in candidate ranking.
                  </p>
                </div>
              </div>
              <div className="pt-6 relative z-10">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 shadow-lg shadow-teal-900/50 transition-all"
                >
                  Explore Benchmarks
                </Link>
              </div>
            </div>

            {/* Card 3: 10,000+ Metrics & Dotted Waveform Graph (Traders Hub Right Card) */}
            <div className="rounded-3xl p-7 border border-slate-700/60 bg-[#090d16] flex flex-col justify-between min-h-[340px] relative overflow-hidden group hover:border-blue-500/50 transition-all">
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase text-slate-400">Assessments Evaluated</span>
                <div className="text-3xl sm:text-4xl font-bold text-white font-mono tracking-tight">
                  10,000+
                </div>
                <p className="text-xs text-slate-400">
                  Students, partners, institutions — benchmarked nationwide across tech domains.
                </p>

                {/* Dotted Waveform Visual Graph (Traders Hub) */}
                <div className="pt-3 pb-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                    <span>100</span>
                    <span>MATCH SPECTRUM</span>
                  </div>
                  <div className="h-16 w-full flex items-end gap-1 px-1 py-2 bg-slate-950/80 rounded-xl border border-slate-800">
                    {[40, 55, 35, 60, 75, 50, 65, 88, 70, 82, 95, 78, 85, 90, 60, 72, 84, 91, 76, 88].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm transition-all duration-300 group-hover:opacity-100"
                        style={{
                          height: `${h}%`,
                          backgroundColor: h >= 80 ? '#38bdf8' : h >= 60 ? '#2563eb' : '#1e293b',
                          opacity: 0.85,
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1">
                    <span>0</span>
                    <span>VERIFIED DISTRIBUTION</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-800/80">
                <span className="text-xs font-mono text-slate-400">No bias. No delays.</span>
                <Link
                  to="/register"
                  className="cyber-btn-primary type-button text-xs py-2 px-4"
                >
                  Start Testing
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FOUR STAKEHOLDER PERSONA PILLARS ───────────────────────────────── */}
      <section id="features" className="py-14 sm:py-20 px-4 sm:px-6 max-w-[1280px] mx-auto space-y-10">
        <div className="space-y-3 max-w-xl">
          <div className="tech-pill text-xs">
            UNIFIED ECOSYSTEM
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Four stakeholders. One connected platform.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Specialized dashboards and workflows for every participant in the career development lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon:  Radar,
              title: 'For Students',
              body:  'Standardized domain assessments, verified skill radar gaps, accredited NPTEL/HCL courses, and export ATS-optimized resumes.',
              cta:   'Start Skill Assessment',
              color: '#3b82f6',
            },
            {
              icon:  Briefcase,
              title: 'For Industry',
              body:  'Post internships with custom skill weights, review verified applicant rankings with zero resume fraud, and discover pre-assessed talent.',
              cta:   'Post Requirements',
              color: '#f59e0b',
            },
            {
              icon:  GraduationCap,
              title: 'For Academicians',
              body:  'Discover AICTE-HCL faculty development programs, apply for joint research grants, and update university curricula with industry data.',
              cta:   'Explore FDPs & Grants',
              color: '#06b6d4',
            },
            {
              icon:  Building2,
              title: 'For Institutions',
              body:  'View real-time batch skill heatmaps, track placement readiness indices, and identify syllabus gaps lagging behind industry benchmarks.',
              cta:   'View Analytics',
              color: '#10b981',
            },
          ].map(({ icon: Icon, title, body, cta, color }) => (
            <div
              key={title}
              className="p-6 rounded-3xl border border-slate-800 bg-[#0b1222] hover:border-slate-700 flex flex-col justify-between group transition-all duration-200"
            >
              <div className="space-y-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: `${color}18`, color }}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
              </div>
              <Link
                to="/register"
                className="pt-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors"
                style={{ color }}
              >
                <span>{cta}</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS: 01 ASSESS • 02 MATCH • 03 BRIDGE ─────────────────── */}
      <section id="methodology" className="py-14 sm:py-20 px-4 sm:px-6 border-t border-slate-800/80 bg-[#060b18]/40">
        <div className="max-w-[1280px] mx-auto space-y-10">
          <div className="space-y-3 max-w-xl">
            <div className="tech-pill text-xs">
              MATCHING ENGINE
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
              Server-side vector matching. No black boxes.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Every score is computed deterministically on the server — skill weights, competency vectors, and fulfillment ratios are fully auditable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Radar,     step: '01', title: 'Assess',  desc: 'Students complete standardized domain assessments. Scores are stored as verified vectors — no self-reporting.' },
              { icon: Zap,       step: '02', title: 'Match',   desc: 'Industry posts requirements with skill weights. The engine computes weighted cosine similarity and ranks candidates.' },
              { icon: BarChart3, step: '03', title: 'Bridge',  desc: 'Gap analysis drives personalized NPTEL/HCL course recommendations. Progress is tracked and re-scored automatically.' },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div
                key={step}
                className="p-7 rounded-3xl border border-slate-800 bg-[#0b1222] hover:border-blue-500/40 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-2xl font-bold text-blue-500/80">{step}</span>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION BANNER (SENTRY-INSPIRED GLOWING CARD) ───────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[1280px] mx-auto">
          <div
            className="rounded-3xl border border-blue-500/30 p-8 sm:p-12 md:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 100% 50%, rgba(37, 99, 235, 0.25) 0%, #0b1222 65%)',
              boxShadow: '0 25px 60px -15px rgba(37, 99, 235, 0.3)',
            }}
          >
            <div className="space-y-3.5 max-w-xl">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <span className="tech-pill text-xs py-0.5">READY TO GET STARTED?</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                Bridge academic potential with industry careers.
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Create an account in seconds. Test real matching algorithms, evaluate skill gap radars, and access verified internship opportunities.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 shrink-0 w-full sm:w-auto">
              <Link
                to="/register"
                className="cyber-btn-primary type-button text-sm py-3 px-6 text-center"
              >
                Sign Up as Student
              </Link>
              <Link
                to="/register"
                className="cyber-btn-secondary type-button text-sm py-3 px-6 text-center"
              >
                Sign Up as Recruiter
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

