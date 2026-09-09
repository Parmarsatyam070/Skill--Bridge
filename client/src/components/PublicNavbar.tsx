import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Layers, Menu, X } from 'lucide-react';

export const PublicNavbar: React.FC = () => {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardPath = user
    ? user.role === 'STUDENT'
      ? '/dashboard'
      : user.role === 'INDUSTRY'
      ? '/industry/dashboard'
      : user.role === 'ACADEMICIAN'
      ? '/academician/dashboard'
      : '/institution/dashboard'
    : '/login';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-[#050608] border-b border-white/10 px-6 py-4 transition-colors">
      <div className="max-w-[1280px] mx-auto flex items-center justify-between">
        {/* Left Section: Layered-squares icon + Wordmark + AICTE BENCHMARK Badge */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            {/* Layered-squares logo icon: 32x32px, rounded square, blue gradient background, white layers icon */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4 text-white" />
            </div>

            {/* Wordmark: "SkillBridge" — "Skill" in white font-semibold, "Bridge" in white font-semibold */}
            <span className="text-white font-semibold text-lg tracking-tight">
              SkillBridge
            </span>
          </Link>

          {/* Pill badge: "● AICTE BENCHMARK" — small dot + monospace uppercase text, subtle border, translucent dark-blue background */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-medium tracking-wider uppercase bg-blue-950/50 text-cyan-400 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            AICTE BENCHMARK
          </span>
        </div>

        {/* Center Section (hidden on mobile, visible md:flex) */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: 'Platform', href: '/' },
            { label: 'Benchmarks', href: '#features' },
            { label: 'Partners', href: '#partners' },
            { label: 'Engine', href: '#methodology' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-150 font-sans"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Right Section: "Go to Workspace" button */}
        <div className="flex items-center gap-3">
          <Link
            to={dashboardPath}
            className="hidden sm:inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-sm bg-gradient-to-r from-teal-500 to-blue-600 text-white transition-all duration-200 hover:brightness-110 hover:scale-[1.02] shadow-lg shadow-blue-950/40"
          >
            <span>Go to Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-white/70 hover:text-white border border-white/10 bg-white/5 transition-colors"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-white/10 flex flex-col gap-3">
          <div className="flex items-center pb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider uppercase bg-blue-950/50 text-cyan-400 border border-blue-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              AICTE BENCHMARK
            </span>
          </div>
          {[
            { label: 'Platform', href: '/' },
            { label: 'Benchmarks', href: '#features' },
            { label: 'Partners', href: '#partners' },
            { label: 'Engine', href: '#methodology' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-sm font-medium text-white/70 hover:text-white py-1.5 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </a>
          ))}
          <div className="pt-3 border-t border-white/10">
            <Link
              to={dashboardPath}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 font-semibold text-sm bg-gradient-to-r from-teal-500 to-blue-600 text-white transition-all hover:brightness-110"
              onClick={() => setMobileOpen(false)}
            >
              <span>Go to Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
