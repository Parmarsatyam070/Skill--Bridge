import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ExternalLink, Activity, Terminal } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-[#030712] font-sans text-slate-300 py-16 px-6 sm:px-10 relative overflow-hidden">
      {/* Subtle bottom ambient glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[250px] pointer-events-none -z-10 blur-3xl opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.3) 0%, rgba(6, 182, 212, 0.1) 50%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-12 relative z-10">
        {/* Col 1: Brand & description */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/30">
              ⚡
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">
                Skill<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Bridge</span>
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/70 border border-cyan-500/40 text-cyan-400">
                v2.6
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
            Unified Academia–Industry Collaboration Platform closing the skill gap with authoritative vector matching, accredited course remediation, and verified digital credentials.
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0b1222] border border-slate-800 text-[11px] font-mono text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Built for Smart India Hackathon (SIH 2024–2026)</span>
          </div>
        </div>

        {/* Col 2: For Students */}
        <div className="space-y-4">
          <div className="text-[11px] font-mono uppercase tracking-widest text-slate-200 font-bold flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-blue-400" />
            <span>For Students</span>
          </div>
          <ul className="space-y-2.5 text-xs">
            {['Standard Assessment', 'Skill Radar & Gaps', 'Matched Internships', 'AI Resume Builder'].map(l => (
              <li key={l}>
                <Link
                  to="/register"
                  className="text-slate-300 hover:text-cyan-400 transition-colors"
                >
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Enterprise & Faculty */}
        <div className="space-y-4">
          <div className="text-[11px] font-mono uppercase tracking-widest text-slate-200 font-bold flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-cyan-400" />
            <span>Enterprise & Faculty</span>
          </div>
          <ul className="space-y-2.5 text-xs">
            {['Post Requirements', 'Ranked Candidate Pool', 'Faculty Dev (FDPs)', 'Joint Research Grants'].map(l => (
              <li key={l}>
                <Link
                  to="/register"
                  className="text-slate-300 hover:text-cyan-400 transition-colors"
                >
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4: Content Partners */}
        <div className="space-y-4">
          <div className="text-[11px] font-mono uppercase tracking-widest text-slate-200 font-bold flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-emerald-400" />
            <span>Content Partners</span>
          </div>
          <ul className="space-y-2.5 text-xs">
            {['NPTEL (IITs/IISc)', 'SWAYAM (Govt of India)', 'HCL TechBee & GUVI', 'Coursera & upGrad'].map(l => (
              <li key={l} className="flex items-center gap-1.5 text-slate-300">
                <ExternalLink className="w-3 h-3 text-cyan-500 flex-shrink-0" />
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto mt-14 pt-6 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span>© 2026 SkillBridge Platform. All rights reserved.</span>
          <span className="hidden sm:inline">·</span>
          <span className="text-slate-300 font-mono text-[11px] hidden sm:inline">AICTE & MoE Compliant</span>
        </div>

        <div className="flex items-center gap-4 font-mono text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SYSTEMS NOMINAL</span>
          </span>
          <span>·</span>
          <Link to="/login" className="hover:text-slate-300 transition-colors">
            Terms
          </Link>
          <span>·</span>
          <Link to="/login" className="hover:text-slate-300 transition-colors">
            Privacy
          </Link>
          <span>·</span>
          <span className="text-cyan-400">v2.6.0</span>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
