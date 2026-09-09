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

/* ─── Design System: Black & Blue Theme Tokens ───────────────────────── */
const C = {
  canvas:    '#030712', // void
  s1:        '#0b1329', // panel
  s2:        '#0f172a', // panel-raised
  s3:        '#131f37',
  hairline:  '#1e293b', // border
  hStrong:   '#334155',
  primary:   '#2563eb', // electric blue
  pHover:    '#1d4ed8',
  cyan:      '#38bdf8',
  emerald:   '#4CC38A', // signal-green
  success:   '#4CC38A',
  ink:       '#ffffff', // text-primary
  inkMuted:  '#94a3b8', // text-muted
  inkSubtle: '#94a3b8',
  amber:     '#E8A23C', // signal-amber
  red:       '#E5637C', // signal-red
} as const;

interface NavItem {
  label: string;
  path:  string;
  icon:  React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
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

  /* Navigation grouped by category */
  let navGroups: NavGroup[] = [];
  if (user.role === 'STUDENT') {
    navGroups = [
      {
        title: 'CAREER',
        items: [
          { label: 'Career Profile',      path: '/profile',        icon: UserCheck,      badge: 'Profile'    },
          { label: 'Overview',            path: '/dashboard',      icon: LayoutDashboard                      },
          { label: 'Opportunity Hub',     path: '/opportunities',  icon: Compass,        badge: '7-Factor'   },
          { label: 'Matched Internships', path: '/internships',    icon: Briefcase,      badge: 'Live %'     },
          { label: 'Report Card',         path: '/report-card',    icon: Award,          badge: 'History'    },
        ],
      },
      {
        title: 'VERIFICATION',
        items: [
          { label: 'Talent Assessments',  path: '/assessments',    icon: Award,          badge: 'Tests'      },
          { label: 'Skill Assessment',    path: '/assessment',     icon: CheckSquare,    badge: 'Daily + Sets'},
          { label: 'DSA & Coding',        path: '/dsa',            icon: Code2,          badge: 'Coding'     },
          { label: 'Skill Profile',       path: '/skill-profile',  icon: Radar                                },
        ],
      },
      {
        title: 'LEARNING',
        items: [
          { label: 'Learning Hub',        path: '/learn',          icon: BookOpen,       badge: 'Resources'  },
          { label: 'Partner Courses',     path: '/courses',        icon: GraduationCap,  badge: 'NPTEL'      },
        ],
      },
      {
        title: 'AI TOOLS',
        items: [
          { label: 'AI Interviews',       path: '/interviews',     icon: Bot,            badge: 'AI Prep'    },
          { label: 'AI Resume Builder',   path: '/resume-builder', icon: FileText,       badge: 'PDF'        },
          { label: 'Portfolio Website',   path: '/portfolio',      icon: Sparkles,       badge: 'AI Builder' },
        ],
      },
    ];
  } else if (user.role === 'INDUSTRY') {
    navGroups = [
      {
        title: 'RECRUITMENT',
        items: [
          { label: 'Recruitment Hub',     path: '/industry/dashboard', icon: LayoutDashboard },
          { label: 'Opportunity Market',  path: '/opportunities',      icon: Compass,        badge: 'Live' },
          { label: 'Post Internship',     path: '/industry/post-job',  icon: Briefcase       },
        ],
      },
      {
        title: 'INTELLIGENCE',
        items: [
          { label: 'Market Intelligence', path: '/industry/intelligence', icon: BarChart3, badge: 'Analytics' },
        ],
      },
      {
        title: 'VERIFICATION & AUDITS',
        items: [
          { label: 'Talent Assessments',  path: '/assessments',        icon: CheckSquare,    badge: 'Tests' },
          { label: 'AI Interviews',       path: '/interviews',         icon: Bot,            badge: 'Audits' },
        ],
      },
      {
        title: 'PARTNERSHIP',
        items: [
          { label: 'Collaborations',      path: '/collaborations',     icon: Handshake,      badge: 'Partner' },
        ],
      },
    ];
  } else if (user.role === 'ACADEMICIAN') {
    navGroups = [
      {
        title: 'ACADEMIA',
        items: [
          { label: 'Academia Hub',        path: '/academician/dashboard',     icon: GraduationCap },
        ],
      },
      {
        title: 'COLLABORATION',
        items: [
          { label: 'FDP & Collaborations',path: '/academician/opportunities', icon: BookOpen },
        ],
      },
    ];
  } else {
    navGroups = [
      {
        title: 'ANALYTICS',
        items: [
          { label: 'Institutional Analytics', path: '/institution/dashboard',    icon: BarChart3 },
        ],
      },
      {
        title: 'CURRICULUM',
        items: [
          { label: 'Skill Intelligence',      path: '/institution/intelligence',icon: Radar, badge: 'Curriculum' },
        ],
      },
      {
        title: 'PARTNERSHIP',
        items: [
          { label: 'Collaborations',          path: '/collaborations',           icon: Handshake, badge: 'Industry' },
        ],
      },
    ];
  }

  /* Role-aware search placeholder helper */
  const getSearchPlaceholder = (role: Role) => {
    switch (role) {
      case 'STUDENT':
        return 'Search opportunities, skills, courses...';
      case 'INDUSTRY':
        return 'Search candidates, skills, opportunities...';
      case 'ACADEMICIAN':
        return 'Search students, skills, courses...';
      case 'INSTITUTION_ADMIN':
        return 'Search students, skills, departments...';
      default:
        return 'Search platform intelligence...';
    }
  };

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
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0 relative overflow-hidden transition-transform group-hover:scale-105 shadow-md shadow-blue-600/30"
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
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
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] shadow-[0_0_6px_#3b82f6] shrink-0" title="Active Platform Status" />
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

          {/* Nav groups */}
          <nav className="p-2 space-y-2">
            {navGroups.map((group, groupIdx) => (
              <div key={group.title || groupIdx} className="space-y-0.5">
                {/* Group section title */}
                {!collapsed && group.title && (
                  <div className="px-3 pt-2 pb-1 text-[9.5px] font-mono font-semibold uppercase tracking-wider text-slate-400/80">
                    {group.title}
                  </div>
                )}
                {collapsed && groupIdx > 0 && (
                  <div className="my-1.5 border-t border-[#1e293b] mx-2" />
                )}

                {group.items.map(item => {
                  const Icon     = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                        collapsed ? 'justify-center' : 'justify-between'
                      } ${
                        isActive
                          ? 'bg-[#0f172a] text-white border-l-2 border-[#2563eb] rounded-l-none pl-2.5 shadow-xs shadow-blue-500/10'
                          : 'text-slate-400 hover:bg-[#0f172a]/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-[#38bdf8]' : 'text-slate-400'}`}
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!collapsed && item.badge && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border shrink-0 ${
                            isActive
                              ? 'bg-[#1e293b] text-[#38bdf8] border-[#38bdf8]/40'
                              : 'bg-[#0b1329] text-slate-400 border-[#1e293b]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
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
              className="flex items-center justify-between px-3 py-2 rounded-xl border border-[#1e293b] text-xs text-slate-400 bg-[#0f172a] hover:text-white hover:border-[#3b82f6] transition-colors"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                <span>Public Portfolio</span>
              </div>
              <ChevronRight className="w-3 h-3 text-slate-400" />
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
        {/* Top header bar — Design System height 56px */}
        <header
          className="shrink-0 z-20 px-3 sm:px-4 md:px-6 flex items-center justify-between border-b"
          style={{
            height:          '56px',
            background:      'rgba(8, 14, 26, 0.85)',
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
            <div className="w-full max-w-[170px] sm:max-w-[240px] md:w-80">
              <div className="relative">
                <Search
                  className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder={getSearchPlaceholder(user.role as Role)}
                  aria-label="Platform intelligence search"
                  className="cyber-input w-full text-xs pl-8 sm:pl-9 pr-2.5 py-1.5 font-sans"
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
