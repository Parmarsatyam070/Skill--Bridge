import React, { useState, useEffect, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Radar,
  CheckSquare,
  Award,
  Briefcase,
  BookOpen,
  FileText,
  UserCheck,
  Building2,
  GraduationCap,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
  ExternalLink,
  Flame,
  Code2,
  Compass,
  Bot,
  Handshake,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SashWidget } from './SashWidget';
import { RecruiterCopilotDrawer } from './recruiter/RecruiterCopilotDrawer';
import { NotificationDropdown } from './NotificationDropdown';
import { ConsoleSkeleton } from './ConsoleSkeleton';
import { ConsoleBackButton } from './ConsoleBackButton';
import { Role } from '@shared/types';

/* ─── Design System v2 Tokens (local) ─────────────────────────────────── */
const C = {
  canvas:    '#08090C', // void
  s1:        '#111318', // panel
  s2:        '#1A1D24', // panel-raised
  s3:        '#1f242d',
  hairline:  '#2A2E38', // border
  hStrong:   '#3d4352',
  primary:   '#2F8C82', // bridge-teal
  pHover:    '#3aa398',
  cyan:      '#2F8C82',
  emerald:   '#4CC38A', // signal-green
  success:   '#4CC38A',
  ink:       '#F4F5F7', // text-primary
  inkMuted:  '#8B90A0', // text-muted
  inkSubtle: '#8B90A0',
  amber:     '#E8A23C', // signal-amber
  red:       '#E5637C', // signal-red
} as const;

interface NavItem {
  label: string;
  path:  string;
  icon:  React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const ConsoleLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-close mobile drawer whenever route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  /* Navigation items by role */
  let navItems: NavItem[] = [];
  if (user.role === 'STUDENT') {
    navItems = [
      { label: 'Career Profile',     path: '/profile',       icon: UserCheck,      badge: 'Profile'    },
      { label: 'Overview',           path: '/dashboard',     icon: LayoutDashboard                      },
      { label: 'Opportunity Hub',    path: '/opportunities', icon: Compass,        badge: '7-Factor'   },
      { label: 'Talent Assessments', path: '/assessments',   icon: Award,          badge: 'Tests'      },
      { label: 'AI Interviews',      path: '/interviews',    icon: Bot,            badge: 'AI Prep'    },
      { label: 'Skill Profile',      path: '/skill-profile', icon: Radar                                },
      { label: 'Skill Assessment',   path: '/assessment',    icon: CheckSquare,    badge: 'Daily + Sets'},
      { label: 'DSA & Coding',       path: '/dsa',           icon: Code2,          badge: 'Coding'     },
      { label: 'Learning Hub',       path: '/learn',         icon: BookOpen,       badge: 'Resources'  },
      { label: 'Report Card',        path: '/report-card',   icon: Award,          badge: 'History'    },
      { label: 'Matched Internships',path: '/internships',   icon: Briefcase,      badge: 'Live %'     },
      { label: 'Partner Courses',    path: '/courses',       icon: GraduationCap,  badge: 'NPTEL'      },
      { label: 'AI Resume Builder',  path: '/resume-builder',icon: FileText,       badge: 'PDF'        },
      { label: 'Portfolio Website',  path: '/portfolio',     icon: Sparkles,       badge: 'AI Builder' },
    ];
  } else if (user.role === 'INDUSTRY') {
    navItems = [
      { label: 'Recruitment Hub',       path: '/industry/dashboard',    icon: LayoutDashboard },
      { label: 'Market Intelligence',   path: '/industry/intelligence', icon: BarChart3,      badge: 'Analytics' },
      { label: 'Opportunity Market',    path: '/opportunities',         icon: Compass,        badge: 'Live' },
      { label: 'Talent Assessments',    path: '/assessments',           icon: CheckSquare,    badge: 'Tests' },
      { label: 'AI Interviews',         path: '/interviews',            icon: Bot,            badge: 'Audits' },
      { label: 'Collaborations',        path: '/collaborations',        icon: Handshake,      badge: 'Partner' },
      { label: 'Post Internship',       path: '/industry/post-job',     icon: Briefcase       },
    ];
  } else if (user.role === 'ACADEMICIAN') {
    navItems = [
      { label: 'Academia Hub',       path: '/academician/dashboard',    icon: GraduationCap },
      { label: 'FDP & Collaborations',path: '/academician/opportunities',icon: BookOpen      },
    ];
  } else {
    navItems = [
      { label: 'Institutional Analytics', path: '/institution/dashboard',    icon: BarChart3 },
      { label: 'Skill Intelligence',      path: '/institution/intelligence',icon: Radar,      badge: 'Curriculum' },
      { label: 'Collaborations',          path: '/collaborations',           icon: Handshake,  badge: 'Industry' },
    ];
  }

  /* Role badge metadata */
  const roleLabels: Record<Role, { title: string; badgeColor: string }> = {
    STUDENT:          { title: 'Student',          badgeColor: C.primary  },
    INDUSTRY:         { title: 'Industry',         badgeColor: C.amber    },
    ACADEMICIAN:      { title: 'Academician',      badgeColor: '#5B9BD9'  },
    INSTITUTION_ADMIN:{ title: 'Institution',      badgeColor: C.success  },
  };
  const roleInfo = roleLabels[user.role as Role] || roleLabels.STUDENT;

  return (
    <div
      className="h-screen w-full flex font-sans antialiased overflow-hidden"
      style={{
        background: C.canvas,
        color:      C.ink,
      }}
    >
      {/* ── MOBILE BACKDROP OVERLAY ────────────────────────────────────── */}
      <div
        className={`fixed inset-0 bg-black/75 z-40 md:hidden backdrop-blur-xs transition-opacity duration-200 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* ── SIDEBAR (DOCKABLE ON DESKTOP, DRAWER ON MOBILE) ─────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 md:static md:z-30 flex flex-col justify-between transition-transform duration-200 md:transition-all ease-in-out h-screen shrink-0 border-r border-[#23252a] ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
        style={{
          background:   C.s1,
          borderColor:  C.hairline,
          width:        collapsed ? '64px' : '232px',
        }}
      >
        {/* Top: branding + user card + nav */}
        <div className="overflow-y-auto flex-1 touch-scroll">
          {/* Brand + collapse toggle */}
          <div
            className="h-14 px-4 flex items-center justify-between border-b"
            style={{ borderColor: C.hairline }}
          >
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 overflow-hidden group"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0 relative overflow-hidden transition-transform group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #2F8C82 0%, #5B7FE0 100%)',
                }}
              >
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              {!collapsed && (
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="font-sans font-semibold text-[15px] tracking-tight truncate"
                    style={{ color: C.ink }}
                  >
                    SkillBridge
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4CC38A] shrink-0" title="Active Platform Status" />
                </div>
              )}
            </Link>

            {/* Desktop collapse button */}
            <button
              onClick={() => setCollapsed(v => !v)}
              className="hidden md:flex p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed
                ? <ChevronRight className="w-3.5 h-3.5" />
                : <ChevronLeft  className="w-3.5 h-3.5" />
              }
            </button>

            {/* Mobile drawer close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User role card */}
          <div
            className={`px-3 py-3 border-b ${collapsed ? 'flex justify-center' : ''}`}
            style={{ borderColor: C.hairline }}
          >
            <div className="flex items-center gap-2.5">
              <img
                src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}`}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover flex-shrink-0 border"
                style={{ borderColor: C.hairline }}
              />
              {!collapsed && (
                <div className="overflow-hidden min-w-0 flex-1">
                  <div
                    className="type-body-sm font-medium truncate"
                    style={{ color: C.ink }}
                    title={user.name}
                  >
                    {user.name}
                  </div>
                  <span
                    className="inline-block text-[10px] font-mono px-2 py-[1px] rounded-full border mt-0.5"
                    style={{
                      background:  C.s2,
                      color:       roleInfo.badgeColor,
                      borderColor: `${roleInfo.badgeColor}40`,
                    }}
                  >
                    {roleInfo.title}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Nav links */}
          <nav className="p-2 space-y-0.5">
            {navItems.map(item => {
              const Icon     = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                    collapsed ? 'justify-center' : 'justify-between'
                  } ${
                    isActive
                      ? 'bg-[#1A1D24] text-[#F4F5F7] border border-[#2A2E38]'
                      : 'text-[#8B90A0] hover:bg-[#1A1D24]/50 hover:text-[#F4F5F7]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#2F8C82]' : 'text-[#8B90A0]'}`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!collapsed && item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border shrink-0 ${
                        isActive
                          ? 'bg-[#111318] text-[#2F8C82] border-[#2A2E38]'
                          : 'bg-[#111318] text-[#8B90A0] border-[#2A2E38]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom actions */}
        <div
          className="p-2.5 border-t space-y-1 shrink-0"
          style={{ borderColor: C.hairline }}
        >
          {/* Public portfolio link for students */}
          {user.role === 'STUDENT' && user.studentProfile && !collapsed && (
            <Link
              to={`/portfolio/${user.studentProfile.id}`}
              target="_blank"
              className="flex items-center justify-between px-3 py-2 rounded-xl border border-[#2A2E38] text-xs text-[#8B90A0] bg-[#1A1D24] hover:text-[#F4F5F7] hover:border-[#3d4352] transition-colors"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Public Portfolio</span>
              </div>
              <ChevronRight className="w-3 h-3 text-[#8B90A0]" />
            </Link>
          )}

          <button
            onClick={() => logout()}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#E5637C] hover:bg-[#E5637C]/10 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN WORKSPACE ─────────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden"
        style={{ background: C.canvas }}
      >
        {/* Top header bar — Design System v2 height 56px */}
        <header
          className="shrink-0 z-20 px-3 sm:px-4 md:px-6 flex items-center justify-between border-b"
          style={{
            height:          '56px',
            background:      'rgba(17, 19, 24, 0.85)',
            borderColor:     C.hairline,
            backdropFilter:  'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          {/* Left: Mobile hamburger + search */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-2">
            {/* Mobile hamburger menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global search */}
            <div className="w-full max-w-[170px] sm:max-w-[240px] md:w-72">
              <div className="relative">
                <Search
                  className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search skills, jobs..."
                  className="cyber-input w-full text-xs pl-8 sm:pl-9 pr-2.5 py-1.5"
                  style={{ fontSize: '12px' }}
                />
              </div>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Streak badge */}
            <div
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full border text-[11px] sm:text-xs font-mono font-semibold"
              style={{
                background:  `${C.amber}12`,
                borderColor: `${C.amber}30`,
                color:       C.amber,
              }}
              title="Daily Activity Streak"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>{user.currentStreak || 1}d</span>
            </div>

            <NotificationDropdown />
          </div>
        </header>

        {/* Content area with structural flex column and responsive padding */}
        <main
          id="console-main-content"
          className="flex-1 flex flex-col min-h-0 p-3.5 sm:p-5 md:p-6 overflow-y-auto max-w-7xl w-full mx-auto touch-scroll"
          style={{ background: C.canvas }}
        >
          <ConsoleBackButton />
          <Suspense fallback={<ConsoleSkeleton />}>
            <div key={location.pathname} className="animate-page-fade-in w-full flex-1 flex flex-col min-h-0">
              {children}
            </div>
          </Suspense>
        </main>
      </div>

      {/* Student AI career navigator */}
      {user.role === 'STUDENT' && <SashWidget />}

      {/* Recruiter AI copilot */}
      {user.role === 'INDUSTRY' && <RecruiterCopilotDrawer />}
    </div>
  );
};
