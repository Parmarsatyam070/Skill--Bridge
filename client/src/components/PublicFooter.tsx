import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, ExternalLink, Heart } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-paper border-t border-line text-ink py-16 px-6 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10">
        {/* Col 1: Brand & SIH Pitch */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-campus-blue via-bridge-teal to-industry-amber flex items-center justify-center text-white font-serif font-bold text-lg">
              S
            </div>
            <span className="font-serif text-xl font-bold text-ink">
              Skill<span className="text-bridge-teal">Bridge</span>
            </span>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed max-w-sm">
            Unified Academia–Industry Collaboration Platform closing the skill gap with authoritative vector matching, accredited course remediation, and verified digital credentials.
          </p>
          <div className="flex items-center gap-2 text-xs font-mono text-campus-blue">
            <ShieldCheck className="w-4 h-4 text-bridge-teal" />
            <span>Built for Smart India Hackathon (SIH 2024–2026)</span>
          </div>
        </div>

        {/* Col 2: For Students */}
        <div className="space-y-3">
          <h5 className="font-mono text-xs uppercase tracking-wider text-ink font-semibold">For Students</h5>
          <ul className="space-y-2 text-xs text-ink-muted">
            <li><Link to="/register" className="hover:text-bridge-teal">Standard Assessment</Link></li>
            <li><Link to="/register" className="hover:text-bridge-teal">Skill Radar & Gaps</Link></li>
            <li><Link to="/register" className="hover:text-bridge-teal">Matched Internships</Link></li>
            <li><Link to="/register" className="hover:text-bridge-teal">AI Resume Builder</Link></li>
          </ul>
        </div>

        {/* Col 3: For Industry & Academics */}
        <div className="space-y-3">
          <h5 className="font-mono text-xs uppercase tracking-wider text-ink font-semibold">Enterprise & Faculty</h5>
          <ul className="space-y-2 text-xs text-ink-muted">
            <li><Link to="/register" className="hover:text-bridge-teal">Post Requirements</Link></li>
            <li><Link to="/register" className="hover:text-bridge-teal">Ranked Candidate Pool</Link></li>
            <li><Link to="/register" className="hover:text-bridge-teal">Faculty Development (FDPs)</Link></li>
            <li><Link to="/register" className="hover:text-bridge-teal">Joint Research Grants</Link></li>
          </ul>
        </div>

        {/* Col 4: Content Partners */}
        <div className="space-y-3">
          <h5 className="font-mono text-xs uppercase tracking-wider text-ink font-semibold">Content Partners</h5>
          <ul className="space-y-2 text-xs text-ink-muted">
            <li className="flex items-center gap-1.5"><ExternalLink className="w-3 h-3 text-bridge-teal" /> NPTEL (IITs/IISc)</li>
            <li className="flex items-center gap-1.5"><ExternalLink className="w-3 h-3 text-bridge-teal" /> SWAYAM (Govt of India)</li>
            <li className="flex items-center gap-1.5"><ExternalLink className="w-3 h-3 text-bridge-teal" /> HCL TechBee & GUVI</li>
            <li className="flex items-center gap-1.5"><ExternalLink className="w-3 h-3 text-bridge-teal" /> Coursera & upGrad</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between text-xs text-ink-muted gap-4">
        <div>
          © 2026 SkillBridge Platform. All rights reserved. Single source of truth matching engine.
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <span>Privacy Policy</span>
          <span>•</span>
          <span>Terms of Service</span>
          <span>•</span>
          <span className="text-bridge-teal">Version 1.0 (Production)</span>
        </div>
      </div>
    </footer>
  );
};
