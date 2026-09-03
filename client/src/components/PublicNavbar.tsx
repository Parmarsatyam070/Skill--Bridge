import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, UserCheck, ShieldCheck } from 'lucide-react';

export const PublicNavbar: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur-md border-b border-line">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand Lockup */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-campus-blue via-bridge-teal to-industry-amber flex items-center justify-center text-white font-serif font-bold text-xl shadow-sm transition-transform group-hover:scale-105">
            S
          </div>
          <div>
            <span className="font-serif text-2xl font-bold tracking-tight text-ink">
              Skill<span className="text-bridge-teal">Bridge</span>
            </span>
            <span className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted -mt-1">
              Academia–Industry Convergence
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-muted">
          <Link to="/" className="hover:text-ink transition-colors">Platform Vision</Link>
          <a href="#features" className="hover:text-ink transition-colors">Domain Benchmarks</a>
          <a href="#partners" className="hover:text-ink transition-colors">Learning Partners</a>
          <a href="#methodology" className="hover:text-ink transition-colors">Matching Engine</a>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-3.5">
          {user ? (
            <Link
              to={
                user.role === 'STUDENT'
                  ? '/dashboard'
                  : user.role === 'INDUSTRY'
                  ? '/industry/dashboard'
                  : user.role === 'ACADEMICIAN'
                  ? '/academician/dashboard'
                  : '/institution/dashboard'
              }
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <span>Go to Workspace ({user.role})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-ink hover:text-bridge-teal hover:bg-black/5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
