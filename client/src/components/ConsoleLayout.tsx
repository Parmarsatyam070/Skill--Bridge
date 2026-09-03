import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Bell,
  Sparkles,
  ExternalLink,
  Shield,
  Zap,
  Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BridgeBotWidget } from './BridgeBotWidget';
import { NotificationDropdown } from './NotificationDropdown';
import { Role } from '@shared/types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const ConsoleLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  // Define navigation items based on role
  let navItems: NavItem[] = [];

  if (user.role === 'STUDENT') {
    navItems = [
      { label: 'Career Profile', path: '/profile', icon: UserCheck, badge: 'Modern' },
      { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Skill Profile', path: '/skill-profile', icon: Radar },
      { label: 'Skill Assessment', path: '/assessment', icon: CheckSquare, badge: 'Sets + Aptitude' },
      { label: 'Learning Hub', path: '/learn', icon: BookOpen, badge: 'Resources' },
      { label: 'Report Card', path: '/report-card', icon: Award, badge: 'History' },
      { label: 'Matched Internships', path: '/internships', icon: Briefcase, badge: 'Live %' },
      { label: 'Partner Courses', path: '/courses', icon: GraduationCap, badge: 'NPTEL' },
      { label: 'AI Resume Builder', path: '/resume-builder', icon: FileText, badge: 'PDF' },
      { label: 'Portfolio Website', path: '/portfolio', icon: Sparkles, badge: 'AI Builder' },
    ];
  } else if (user.role === 'INDUSTRY') {
    navItems = [
      { label: 'Recruitment Hub', path: '/industry/dashboard', icon: LayoutDashboard },
      { label: 'Post Internship', path: '/industry/post-job', icon: Briefcase },
    ];
  } else if (user.role === 'ACADEMICIAN') {
    navItems = [
      { label: 'Academia Hub', path: '/academician/dashboard', icon: GraduationCap },
      { label: 'FDP & Collaborations', path: '/academician/opportunities', icon: BookOpen },
    ];
  } else {
    navItems = [
      { label: 'Institutional Analytics', path: '/institution/dashboard', icon: BarChart3 },
    ];
  }

  const roleLabels: Record<Role, { title: string; color: string; badgeBg: string }> = {
    STUDENT: { title: 'Student', color: 'text-bridge-teal', badgeBg: 'bg-bridge-teal/15 text-bridge-teal border-bridge-teal/30' },
    INDUSTRY: { title: 'Industry Recruiter', color: 'text-industry-amber', badgeBg: 'bg-industry-amber/15 text-industry-amber border-industry-amber/30' },
    ACADEMICIAN: { title: 'Academician', color: 'text-campus-blue', badgeBg: 'bg-campus-blue/20 text-[#8cb4e6] border-campus-blue/40' },
    INSTITUTION_ADMIN: { title: 'Institution Admin', color: 'text-status-green', badgeBg: 'bg-status-green/15 text-status-green border-status-green/30' },
  };

  const currentRoleInfo = roleLabels[user.role as Role] || roleLabels.STUDENT;

  return (
    <div className="min-h-screen bg-console-bg text-console-text flex font-sans antialiased selection:bg-bridge-teal selection:text-white">
      {/* Persistent Left Sidebar */}
      <aside
        className={`bg-console-panel border-r border-console-border flex flex-col justify-between transition-all duration-200 z-30 sticky top-0 h-screen ${
          collapsed ? 'w-[72px]' : 'w-[240px]'
        }`}
      >
        {/* Top Branding & Pinned Role Lockup */}
        <div>
          <div className="p-4 flex items-center justify-between border-b border-console-border">
            <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-campus-blue via-bridge-teal to-industry-amber flex items-center justify-center text-white font-serif font-bold text-base flex-shrink-0 shadow-sm">
                S
              </div>
              {!collapsed && (
                <span className="font-serif text-lg font-bold tracking-tight text-console-text">
                  Skill<span className="text-bridge-teal">Bridge</span>
                </span>
              )}
            </Link>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg text-console-text-muted hover:text-console-text hover:bg-console-panel-raised transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* User Role Card */}
          <div className={`p-3.5 border-b border-console-border/60 ${collapsed ? 'text-center' : ''}`}>
            <div className="flex items-center gap-2.5">
              <img
                src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-console-border object-cover flex-shrink-0"
              />
              {!collapsed && (
                <div className="overflow-hidden">
                  <div className="text-xs font-semibold text-console-text truncate">{user.name}</div>
                  <span className={`inline-block text-[10px] font-mono font-medium px-1.5 py-0.2 rounded border ${currentRoleInfo.badgeBg} truncate max-w-full`}>
                    {currentRoleInfo.title}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-2.5 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-bridge-teal text-white font-semibold shadow-sm'
                      : 'text-console-text-muted hover:text-console-text hover:bg-console-panel-raised'
                  } ${collapsed ? 'justify-center' : 'justify-between'}`}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? 'text-white' : 'text-console-text-muted group-hover:text-bridge-teal transition-colors'
                      }`}
                    />
                    {!collapsed && <span>{item.label}</span>}
                  </div>

                  {!collapsed && item.badge && (
                    <span
                      className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded ${
                        isActive ? 'bg-white/20 text-white' : 'bg-console-panel-raised text-console-text-muted border border-console-border'
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

        {/* Bottom Actions */}
        <div className="p-3 border-t border-console-border space-y-1">
          {/* Quick Shareable Portfolio Link for Students */}
          {user.role === 'STUDENT' && user.studentProfile && !collapsed && (
            <Link
              to={`/portfolio/${user.studentProfile.id}`}
              target="_blank"
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-console-panel-raised text-console-text-muted hover:text-bridge-teal text-xs transition-colors border border-console-border"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Public Portfolio</span>
              </div>
              <span className="text-[10px] font-mono text-status-green">Print-Ready</span>
            </Link>
          )}

          <button
            onClick={() => logout()}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-status-red/90 hover:bg-status-red/10 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Log Out"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-console-panel/80 border-b border-console-border sticky top-0 z-20 backdrop-blur-md px-6 flex items-center justify-between">
          {/* Global Search */}
          <div className="flex items-center gap-3 w-72">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-console-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search skills, internships, courses..."
                className="w-full bg-console-bg border border-console-border rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-console-text placeholder:text-console-text-muted focus:outline-none focus:border-bridge-teal"
              />
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3.5">
            {/* Daily Activity Streak Badge */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-industry-amber/10 border border-industry-amber/30 text-industry-amber text-xs font-mono font-bold shadow-2xs transition-all hover:bg-industry-amber/15 cursor-help"
              title="Daily Activity Streak: Requires at least 1 submitted practice set per day"
            >
              <Flame className="w-4 h-4 fill-industry-amber text-industry-amber" />
              <span>{user.currentStreak || 1}-day streak</span>
            </div>

            {/* Notification Bell Dropdown */}
            <NotificationDropdown />
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Persistent Bridge Bot Floating Assistant */}
      <BridgeBotWidget />
    </div>
  );
};
