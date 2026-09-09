import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
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
} from 'lucide-react';
import { PublicNavbar } from '../components/PublicNavbar';
import { PublicFooter } from '../components/PublicFooter';
import { FluidRibbonBackground } from '../components/FluidRibbonBackground';

export const LandingPage: React.FC = () => {
  /* Interactive match simulator state */
  const [reactScore, setReactScore] = useState(84);
  const [tsScore, setTsScore] = useState(70);
  const [nodeScore, setNodeScore] = useState(78);

  const simFulfillment =
    5 * Math.min(1.0, reactScore / 80) +
    4 * Math.min(1.0, tsScore / 70) +
    4 * Math.min(1.0, nodeScore / 70);
  const simScore = Math.min(100, Math.round((simFulfillment / 13) * 100));

  return (
    <div className="min-h-screen font-sans antialiased text-white bg-[#05070a] overflow-x-hidden selection:bg-teal-500 selection:text-white relative">
      {/* ── Premium Abstract Futuristic Animated Background (Strictly behind all UI) ── */}
      <FluidRibbonBackground />

      {/* Fixed Dark Navbar */}
      <PublicNavbar />

      <main className="relative z-10 pt-20 md:pt-24">
        {/* ── HERO SECTION COMPONENT ── */}
        <section className="relative w-full min-h-screen overflow-hidden bg-transparent flex flex-col justify-between pt-12 md:pt-16 pb-12">
          {/* Decorative Background Glow Blobs (Container Level, z-0) */}
          {/* Top-left glow: 600x600px, bg-teal-500/10, blur-[120px], mix-blend-screen */}
          <div
            className="absolute top-[-15%] left-[10%] w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-[120px] mix-blend-screen pointer-events-none z-0"
          />

          {/* Bottom-right glow: 500x500px, bg-indigo-900/20, blur-[120px], mix-blend-screen */}
          <div
            className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] rounded-full bg-indigo-900/20 blur-[120px] mix-blend-screen pointer-events-none z-0"
          />

          {/* Subtle Ambient Radial and Grid Accents */}
          <div
            className="absolute top-0 right-0 w-[550px] sm:w-[750px] h-[550px] sm:h-[750px] rounded-full pointer-events-none z-0 opacity-40 blur-3xl"
            style={{
              background:
                'radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, rgba(59, 130, 246, 0.12) 35%, transparent 70%)',
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,#000_60%,transparent_100%)] pointer-events-none z-0 opacity-40" />

          {/* Two-Column Grid: Content Left, Engine Panel Right (z-10) */}
          <div className="max-w-[1280px] w-full mx-auto px-6 py-8 sm:py-12 my-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
              
              {/* Content Column (Left, lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-6 sm:space-y-8">
                
                {/* Status Badges Row */}
                <motion.div
                  className="flex flex-wrap items-center gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Badge 1: ● AICTE ALIGNED */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-teal-500/30 bg-teal-950/40 text-teal-300 font-mono text-xs font-medium tracking-wide uppercase shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-[0_0_8px_#2dd4bf]" />
                    <span>AICTE ALIGNED</span>
                  </div>

                  {/* Badge 2: ● STATUS: ▪ LIVE MONITORING */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-950/40 text-blue-300 font-mono text-xs font-medium tracking-wide uppercase shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
                    <span>STATUS: ▪ LIVE MONITORING</span>
                  </div>
                </motion.div>

                {/* Main Headline */}
                <motion.h1
                  className="font-sans font-bold sm:font-extrabold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-white"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                >
                  Built for Talent.{' '}
                  <span className="block sm:inline bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
                    Trusted Nationwide.
                  </span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                  className="font-sans text-lg sm:text-xl text-white/70 leading-relaxed max-w-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  SkillBridge connects Students, Recruiters, Academicians, and Institutions through server-side vector matching, verified NPTEL/HCL certifications, and zero-bias skill telemetry.
                </motion.p>

                {/* CTA Buttons Container */}
                <motion.div
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  {/* Primary Button — Signature Shape + Glow (Two-part pill with inset 40x40 circle) */}
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-between sm:justify-start gap-4 rounded-full bg-white pl-6 pr-2 py-2 text-[#05070a] transition-all duration-200 hover:shadow-[0_0_25px_rgba(56,189,248,0.4)] hover:scale-105 group shadow-md"
                  >
                    <span className="font-sans font-medium text-sm sm:text-base text-[#05070a] whitespace-nowrap">
                      Take Standard Assessment
                    </span>
                    <span className="w-10 h-10 min-w-[40px] rounded-full bg-gradient-to-r from-teal-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                      <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>

                  {/* Secondary Button */}
                  <Link
                    to="/login"
                    className="rounded-full px-6 py-3 font-medium bg-transparent border border-white/20 text-white hover:bg-white/5 hover:border-white/30 transition-all duration-200 flex items-center justify-center text-sm sm:text-base"
                  >
                    Sign In to Workspace
                  </Link>
                </motion.div>

                {/* Stats Row */}
                <motion.div
                  className="pt-8 border-t border-white/10"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <div className="flex flex-wrap gap-8 sm:gap-12">
                    {/* Stat 1 */}
                    <div>
                      <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-sky-400">
                        5 Domains
                      </div>
                      <div className="text-xs font-sans text-white/50 mt-1 uppercase tracking-wider">
                        Industry Benchmarks
                      </div>
                    </div>

                    {/* Stat 2 */}
                    <div>
                      <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-blue-400">
                        100% Audited
                      </div>
                      <div className="text-xs font-sans text-white/50 mt-1 uppercase tracking-wider">
                        Deterministic Vector
                      </div>
                    </div>

                    {/* Stat 3 */}
                    <div>
                      <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-emerald-400">
                        5 Partners
                      </div>
                      <div className="text-xs font-sans text-white/50 mt-1 uppercase tracking-wider">
                        NPTEL · SWAYAM · HCL
                      </div>
                    </div>
                  </div>
                </motion.div>

              </div>

              {/* Engine Panel Column (Right, lg:col-span-5) */}
              <div className="lg:col-span-5 relative">
                {/* Soft ambient chromatic glow behind card */}
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-teal-500/15 via-blue-500/20 to-indigo-500/15 blur-[80px] pointer-events-none -z-10 opacity-70" />

                <motion.div
                  className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl p-6 space-y-6 shadow-[0_0_60px_rgba(59,130,246,0.12),inset_0_1px_0_rgba(255,255,255,0.08)] relative overflow-hidden"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  {/* Subtle Card Glow Top Edge Highlight */}
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </span>
                      <span className="font-mono text-sm font-semibold uppercase tracking-wider text-slate-200">
                        VECTOR MATCH ENGINE
                      </span>
                    </div>
                    <span className="font-mono text-xs uppercase px-2.5 py-0.5 rounded-full border border-white/10 bg-white/5 text-slate-400">
                      SERVER COMPUTED
                    </span>
                  </div>

                  {/* Match Visualization Row */}
                  <div className="rounded-xl border border-white/10 bg-[#050608]/70 p-4 relative overflow-hidden">
                    {/* Dashed connector line in white/20 between the three blocks */}
                    <div className="hidden sm:block absolute top-1/2 left-8 right-8 -translate-y-1/2 border-t border-dashed border-white/20 pointer-events-none z-0" />

                    <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
                      {/* Sub-block 1: Left - Candidate Vector */}
                      <div className="flex items-center gap-2.5 bg-[#05070a] border border-white/10 rounded-xl px-3 py-2 w-full sm:w-auto shadow-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf] flex-shrink-0 animate-pulse" />
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 block">
                            VERIFIED COMPETENCY
                          </span>
                          <span className="text-xs font-semibold text-white font-sans whitespace-nowrap">
                            Candidate Vector (100%)
                          </span>
                        </div>
                      </div>

                      {/* Sub-block 2: Center - Circular Match Badge */}
                      <div className="flex flex-col items-center justify-center w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-[#080b12] border border-blue-500/30 shadow-lg text-center p-2 flex-shrink-0 z-10">
                        <span className="text-xs sm:text-sm font-bold text-white font-mono leading-tight">
                          100% Match
                        </span>
                        <span className="text-[9px] font-mono text-teal-400 mt-0.5 leading-tight">
                          Bridge Path Active
                        </span>
                      </div>

                      {/* Sub-block 3: Right - Matched Target */}
                      <div className="flex items-center justify-end gap-2.5 bg-[#05070a] border border-white/10 rounded-xl px-3 py-2 w-full sm:w-auto text-right shadow-sm">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 block">
                            MATCHED TARGET
                          </span>
                          <span className="text-xs font-semibold text-white font-sans whitespace-nowrap">
                            TechCorp Full-Stack Intern
                          </span>
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b] flex-shrink-0" />
                      </div>
                    </div>
                  </div>

                  {/* Skill Sliders (3x, stacked, space-y-4) */}
                  <div className="space-y-4">
                    {[
                      {
                        label: 'React.js Competency',
                        val: reactScore,
                        set: setReactScore,
                        min: 30,
                        delay: 0.1,
                      },
                      {
                        label: 'TypeScript Systems',
                        val: tsScore,
                        set: setTsScore,
                        min: 20,
                        delay: 0.2,
                      },
                      {
                        label: 'Node.js Architecture',
                        val: nodeScore,
                        set: setNodeScore,
                        min: 20,
                        delay: 0.3,
                      },
                    ].map(({ label, val, set, min, delay }) => (
                      <div key={label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-sans text-white/80">{label}</span>
                          <span className="font-mono font-bold text-blue-400">{val}%</span>
                        </div>
                        {/* Track with Motion animated fill and circular thumb handle */}
                        <div className="group relative h-2.5 w-full rounded-full bg-[#34456B] overflow-visible flex items-center">
                          <motion.div
                            className="h-full rounded-full bg-[#2F8C82] relative"
                            initial={{ width: 0 }}
                            animate={{ width: `${val}%` }}
                            transition={{ duration: 0.8, delay }}
                          >
                            <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-[#F4F5F7] border-2 border-[#2F8C82] shadow-[0_0_8px_rgba(47,140,130,0.45)] group-hover:shadow-[0_0_14px_rgba(47,140,130,0.75)] transition-shadow pointer-events-none" />
                          </motion.div>
                          <input
                            type="range"
                            min={min}
                            max={100}
                            value={val}
                            onChange={e => set(Number(e.target.value))}
                            aria-label={`${label} proficiency: ${val}%`}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-white/60 font-sans">Match Fulfillment:</span>
                    <span className="text-xs sm:text-sm font-semibold text-emerald-400 font-mono">
                      {simScore === 100 ? '100%' : `${simScore}%`} • Priority Interview Tier
                    </span>
                  </div>

                </motion.div>
              </div>

            </div>
          </div>

          {/* Trusted-By Strip (Bottom of Hero, full width, above thin top border) */}
          <div className="w-full border-t border-white/10 pt-6 px-6 mt-12 relative z-10">
            <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <span className="text-xs font-mono uppercase tracking-wide text-white/40">
                TRUSTED BY NATIONAL BENCHMARKS &amp; CAMPUS TEAMS
              </span>
              <div className="flex flex-wrap items-center justify-center gap-8 text-white/60 font-mono text-xs sm:text-sm font-semibold tracking-wider">
                <span className="hover:text-white transition-colors">▲ AICTE</span>
                <span className="hover:text-white transition-colors">NPTEL</span>
                <span className="hover:text-white transition-colors">SWAYAM</span>
                <span className="hover:text-white transition-colors">HCL GUVI</span>
                <span className="hover:text-white transition-colors">VERCEL</span>
                <span className="hover:text-white transition-colors">CURSOR</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── TRADERS HUB 3-CARD SHOWCASE SECTION ── */}
        <section className="py-16 sm:py-24 px-6 border-y border-white/10 bg-white/[0.01] relative">
          <div className="max-w-[1280px] mx-auto space-y-12">
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono tracking-wider uppercase bg-white/5 border border-white/10 text-cyan-400">
                CORE INFRASTRUCTURE
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-sans">
                Focused on reliability, regulation, and real local support
              </h2>
              <p className="text-sm sm:text-base text-white/70 font-sans">
                Built on transparent mathematical algorithms, national compliance frameworks, and verified talent pipelines.
              </p>
            </div>

            {/* 3 Showcase Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="rounded-2xl p-7 border border-white/10 bg-white/[0.02] backdrop-blur-sm flex flex-col justify-between min-h-[340px] relative overflow-hidden group hover:border-blue-500/50 transition-all">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2 font-sans">
                      Accredited &amp; Regulated
                    </h3>
                    <p className="text-sm text-white/70 leading-relaxed font-sans">
                      Fully compliant under AICTE regulation and national standards. Candidate competency vectors are immutable.
                    </p>
                  </div>
                </div>
                <div className="pt-6 flex items-center justify-between border-t border-white/10">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                  >
                    Start Assessment
                  </Link>
                  <span className="text-[11px] font-mono text-white/40">AICTE PASS</span>
                </div>
              </div>

              {/* Card 2 */}
              <div
                className="rounded-2xl p-7 border border-teal-500/30 flex flex-col justify-between min-h-[340px] relative overflow-hidden group hover:border-teal-400/60 transition-all"
                style={{
                  background: 'linear-gradient(160deg, rgba(6, 39, 38, 0.4) 0%, rgba(3, 21, 24, 0.6) 50%, #05070a 100%)',
                }}
              >
                <div className="space-y-4 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2 font-sans">
                      Deterministic Engine, 24/7
                    </h3>
                    <p className="text-sm text-teal-100/70 leading-relaxed font-sans">
                      Evaluated with verified domain algorithms. No black-box AI hallucinations. Zero bias in candidate ranking.
                    </p>
                  </div>
                </div>
                <div className="pt-6 relative z-10 border-t border-teal-500/20">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 shadow-lg shadow-teal-950/50 transition-all"
                  >
                    Explore Benchmarks
                  </Link>
                </div>
              </div>

              {/* Card 3 */}
              <div className="rounded-2xl p-7 border border-white/10 bg-white/[0.02] backdrop-blur-sm flex flex-col justify-between min-h-[340px] relative overflow-hidden group hover:border-blue-500/50 transition-all">
                <div className="space-y-3">
                  <span className="text-xs font-mono uppercase text-white/40">Assessments Evaluated</span>
                  <div className="text-3xl sm:text-4xl font-bold text-white font-mono tracking-tight">
                    10,000+
                  </div>
                  <p className="text-xs text-white/70 font-sans">
                    Students, partners, institutions — benchmarked nationwide across tech domains.
                  </p>

                  {/* Dotted Waveform Visual Graph */}
                  <div className="pt-3 pb-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-white/40 mb-1">
                      <span>100</span>
                      <span>MATCH SPECTRUM</span>
                    </div>
                    <div className="h-16 w-full flex items-end gap-1 px-1 py-2 bg-black/60 rounded-xl border border-white/10">
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
                    <div className="flex items-center justify-between text-[10px] font-mono text-white/40 mt-1">
                      <span>0</span>
                      <span>VERIFIED DISTRIBUTION</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-white/10">
                  <span className="text-xs font-mono text-white/40">No bias. No delays.</span>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                  >
                    Start Testing
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOUR STAKEHOLDER PERSONA PILLARS ── */}
        <section id="features" className="py-16 sm:py-24 px-6 max-w-[1280px] mx-auto space-y-12">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono tracking-wider uppercase bg-white/5 border border-white/10 text-cyan-400">
              UNIFIED ECOSYSTEM
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white font-sans">
              Four stakeholders. One connected platform.
            </h2>
            <p className="text-white/70 text-sm sm:text-base font-sans">
              Specialized dashboards and workflows for every participant in the career development lifecycle.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Radar,
                title: 'For Students',
                body: 'Standardized domain assessments, verified skill radar gaps, accredited NPTEL/HCL courses, and export ATS-optimized resumes.',
                cta: 'Start Skill Assessment',
                color: '#38bdf8',
              },
              {
                icon: Briefcase,
                title: 'For Industry',
                body: 'Post internships with custom skill weights, review verified applicant rankings with zero resume fraud, and discover pre-assessed talent.',
                cta: 'Post Requirements',
                color: '#f59e0b',
              },
              {
                icon: GraduationCap,
                title: 'For Academicians',
                body: 'Discover AICTE-HCL faculty development programs, apply for joint research grants, and update university curricula with industry data.',
                cta: 'Explore FDPs & Grants',
                color: '#2dd4bf',
              },
              {
                icon: Building2,
                title: 'For Institutions',
                body: 'View real-time batch skill heatmaps, track placement readiness indices, and identify syllabus gaps lagging behind industry benchmarks.',
                cta: 'View Analytics',
                color: '#10b981',
              },
            ].map(({ icon: Icon, title, body, cta, color }) => (
              <div
                key={title}
                className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 flex flex-col justify-between group transition-all duration-200"
              >
                <div className="space-y-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${color}18`, color }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight font-sans">{title}</h3>
                  <p className="text-sm text-white/70 leading-relaxed font-sans">{body}</p>
                </div>
                <Link
                  to="/register"
                  className="pt-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider font-mono transition-colors"
                  style={{ color }}
                >
                  <span>{cta}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS: 01 ASSESS • 02 MATCH • 03 BRIDGE ── */}
        <section id="methodology" className="py-16 sm:py-24 px-6 border-t border-white/10 bg-white/[0.01]">
          <div className="max-w-[1280px] mx-auto space-y-12">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono tracking-wider uppercase bg-white/5 border border-white/10 text-cyan-400">
                MATCHING ENGINE
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white font-sans">
                Server-side vector matching. No black boxes.
              </h2>
              <p className="text-white/70 text-sm sm:text-base font-sans">
                Every score is computed deterministically on the server — skill weights, competency vectors, and fulfillment ratios are fully auditable.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Radar,
                  step: '01',
                  title: 'Assess',
                  desc: 'Students complete standardized domain assessments. Scores are stored as verified vectors — no self-reporting.',
                },
                {
                  icon: Zap,
                  step: '02',
                  title: 'Match',
                  desc: 'Industry posts requirements with skill weights. The engine computes weighted cosine similarity and ranks candidates.',
                },
                {
                  icon: BarChart3,
                  step: '03',
                  title: 'Bridge',
                  desc: 'Gap analysis drives personalized NPTEL/HCL course recommendations. Progress is tracked and re-scored automatically.',
                },
              ].map(({ icon: Icon, step, title, desc }) => (
                <div
                  key={step}
                  className="p-7 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-blue-500/40 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-2xl font-bold text-sky-400/80">{step}</span>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-sky-400 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 font-sans">{title}</h3>
                  <p className="text-sm text-white/70 leading-relaxed font-sans">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CALL TO ACTION BANNER ── */}
        <section className="py-16 sm:py-24 px-6">
          <div className="max-w-[1280px] mx-auto">
            <div
              className="rounded-3xl border border-blue-500/30 p-8 sm:p-12 md:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden"
              style={{
                background:
                  'radial-gradient(circle at 100% 50%, rgba(37, 99, 235, 0.22) 0%, #05070a 70%)',
                boxShadow: '0 25px 60px -15px rgba(37, 99, 235, 0.25)',
              }}
            >
              <div className="space-y-4 max-w-xl">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-400" />
                  <span className="font-mono text-xs uppercase px-2.5 py-0.5 rounded-full border border-teal-500/30 bg-teal-950/40 text-teal-300">
                    READY TO GET STARTED?
                  </span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight font-sans">
                  Bridge academic potential with industry careers.
                </h2>
                <p className="text-white/70 text-sm sm:text-base leading-relaxed font-sans">
                  Create an account in seconds. Test real matching algorithms, evaluate skill gap radars, and access verified internship opportunities.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 shrink-0 w-full sm:w-auto">
                <Link
                  to="/register"
                  className="rounded-full px-6 py-3 font-medium bg-gradient-to-r from-teal-400 to-blue-500 text-white hover:brightness-110 hover:scale-105 transition-all text-center shadow-lg shadow-teal-950/40"
                >
                  Sign Up as Student
                </Link>
                <Link
                  to="/register"
                  className="rounded-full px-6 py-3 font-medium bg-white/5 border border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all text-center"
                >
                  Sign Up as Recruiter
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="relative z-10">
        <PublicFooter />
      </div>
    </div>
  );
};

export default LandingPage;
