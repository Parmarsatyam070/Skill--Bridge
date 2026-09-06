import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Menu, X } from 'lucide-react';

export const PublicNavbar: React.FC = () => {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardPath =
    user?.role === 'STUDENT'          ? '/dashboard'
    : user?.role === 'INDUSTRY'       ? '/industry/dashboard'
    : user?.role === 'ACADEMICIAN'    ? '/academician/dashboard'
    : '/institution/dashboard';

  return (
    <>
      {/* Cyber-Luminescent top-nav: deep obsidian canvas, 60px height, hairline border */}
      <header
        className="sticky top-0 z-40 border-b transition-colors"
        style={{
          background: 'rgba(3, 7, 18, 0.85)',
          borderColor: '#1e293b',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          height: '60px',
        }}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">

          {/* Brand lockup — zk.Link / Cyber polyhedral mark */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 relative overflow-hidden transition-transform group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  boxShadow: '0 0 16px rgba(37, 99, 235, 0.5)',
                }}
              >
                {/* Geometric node glyph */}
                <svg className="w-4 h-4 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span
                className="font-sans font-semibold text-[16px] tracking-tight"
                style={{ color: '#f8fafc' }}
              >
                Skill<span style={{ color: '#3b82f6' }}>Bridge</span>
              </span>
            </Link>

            {/* Sentry-style tech pill chip (hidden on smallest screens) */}
            <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-medium tracking-wider uppercase bg-blue-950/40 text-cyan-400 border border-cyan-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              AICTE BENCHMARK
            </span>
          </div>

          {/* Center nav — hidden below md */}
          <nav className="hidden md:flex items-center gap-7">
            {[
              { label: 'Platform', href: '/' },
              { label: 'Benchmarks', href: '#features' },
              { label: 'Partners',   href: '#partners' },
              { label: 'Engine',     href: '#methodology' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="type-body-sm transition-colors duration-150"
                style={{ color: '#94a3b8' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f8fafc')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Right CTAs */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <Link
                to={dashboardPath}
                className="hidden md:inline-flex items-center gap-2 cyber-btn-primary type-button text-xs py-2 px-4"
              >
                <span>Go to Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden md:inline-flex cyber-btn-secondary type-button text-xs py-2 px-4"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="hidden md:inline-flex items-center gap-1.5 cyber-btn-primary type-button text-xs py-2 px-4"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg transition-colors border border-slate-800 bg-slate-900/60"
              style={{ color: '#94a3b8' }}
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu — surface-1 panel */}
        {mobileOpen && (
          <div
            className="md:hidden border-t px-6 py-4 flex flex-col gap-3 animate-fade-in"
            style={{ background: '#0b1222', borderColor: '#1e293b' }}
          >
            {[
              { label: 'Platform',   href: '/' },
              { label: 'Benchmarks', href: '#features' },
              { label: 'Partners',   href: '#partners' },
              { label: 'Engine',     href: '#methodology' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="type-body-sm py-1.5 text-slate-300 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-3 border-t" style={{ borderColor: '#1e293b' }}>
              {user ? (
                <Link
                  to={dashboardPath}
                  className="cyber-btn-primary type-button text-center w-full"
                  onClick={() => setMobileOpen(false)}
                >
                  Go to Workspace
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="cyber-btn-secondary type-button text-center w-full"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="cyber-btn-primary type-button text-center w-full"
                    onClick={() => setMobileOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};
