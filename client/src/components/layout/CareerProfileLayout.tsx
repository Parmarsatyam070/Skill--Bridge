import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  User,
  Briefcase,
  Code2,
  BookOpen,
  FileText,
  Settings,
  Search,
  Building,
  Bell,
  ChevronDown,
  Sparkles,
  LogOut,
  HelpCircle,
  Menu,
  X,
  Radar,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CareerProfileLayoutProps {
  children: React.ReactNode;
}

export const CareerProfileLayout: React.FC<CareerProfileLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navItems = [
    { label: 'Home', icon: Home, path: '/dashboard', activePaths: ['/dashboard'] },
    { label: 'Profile', icon: User, path: '/profile', activePaths: ['/profile'] },
    { label: 'Opportunities', icon: Briefcase, path: '/internships', activePaths: ['/internships'] },
    { label: 'Skill Radar', icon: Radar, path: '/skill-profile', activePaths: ['/skill-profile'] },
    { label: 'Assessments', icon: Code2, path: '/assessment', activePaths: ['/assessment'] },
    { label: 'Learning Hub', icon: BookOpen, path: '/learn', activePaths: ['/learn'] },
    { label: 'Courses', icon: Building, path: '/courses', activePaths: ['/courses'] },
    { label: 'Resume Builder', icon: FileText, path: '/resume-builder', activePaths: ['/resume-builder', '/resumes'] },
    { label: 'Settings', icon: Settings, path: '/portfolio', activePaths: ['/portfolio'] },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/internships?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const currentUserName = user?.name || 'Satyam Singh';
  const currentUserAvatar =
    user?.avatarUrl ||
    `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1E293B] font-sans flex flex-col selection:bg-teal-500 selection:text-white">
      {/* ─────────────────────────────────────────────────────────────
          TOP NAVIGATION BAR
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200/80 shadow-xs h-16 flex items-center px-4 sm:px-6 justify-between gap-4">
        {/* Left: Logo & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/profile" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <span className="font-serif font-bold text-lg tracking-tight text-gray-900 flex items-center gap-1.5">
                SkillBridge
                <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  Career
                </span>
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Prominent Search Bar */}
        <div className="flex-1 max-w-xl mx-2 sm:mx-6">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Opportunities, Skills, Companies..."
              className="w-full bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 focus:border-teal-600 rounded-full pl-10 pr-24 py-2 text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:ring-teal-500/10 transition-all shadow-2xs"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1">
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-gray-200/70 text-gray-600">
                ⌘K
              </span>
            </div>
          </form>
        </div>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* For Business Button */}
          <Link
            to="/industry/dashboard"
            className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shadow-2xs"
          >
            <Building className="w-3.5 h-3.5 text-gray-500" />
            <span>For Business</span>
          </Link>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500 ring-2 ring-white animate-pulse" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-gray-200 shadow-xl p-4 z-50 text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="font-semibold text-gray-900">Notifications</span>
                  <span className="text-[11px] text-teal-600 font-medium">Mark all read</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-100/80 space-y-1">
                    <p className="font-medium text-gray-800">
                      🎯 Match Alert: High match (94%) at Google India
                    </p>
                    <span className="text-[10px] text-gray-500 font-mono">10 minutes ago</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <p className="text-gray-700">
                      📜 Skill verified: React.js score calibrated to 88%
                    </p>
                    <span className="text-[10px] text-gray-400 font-mono">2 hours ago</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <img
                src={currentUserAvatar}
                alt={currentUserName}
                className="w-8 h-8 rounded-full object-cover border-2 border-teal-500/40"
              />
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 hidden sm:block" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-gray-200 shadow-xl p-2 z-50 text-xs space-y-1">
                <div className="px-3 py-2 border-b border-gray-100">
                  <div className="font-bold text-gray-900 truncate">{currentUserName}</div>
                  <div className="text-[11px] text-gray-500 truncate">{user?.email || 'satyam@skillbridge.edu'}</div>
                  <span className="inline-block mt-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Student Member
                  </span>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors font-medium"
                >
                  <User className="w-4 h-4" />
                  <span>My Profile Dashboard</span>
                </Link>

                <Link
                  to="/resume-builder"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors font-medium"
                >
                  <FileText className="w-4 h-4" />
                  <span>Resume Builder</span>
                </Link>

                <Link
                  to="/dashboard"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors font-medium"
                >
                  <Radar className="w-4 h-4" />
                  <span>Student Console</span>
                </Link>

                <div className="pt-1 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          BODY: PERSISTENT LEFT SIDEBAR + MAIN CONTENT AREA
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Persistent Sidebar (Desktop Icon Rail) */}
        <aside className="hidden md:flex flex-col items-center py-6 px-3 w-20 bg-white border-r border-gray-200/80 sticky top-16 h-[calc(100vh-4rem)] space-y-3 z-30 shadow-2xs">
          <div className="space-y-1.5 w-full flex flex-col items-center">
            {navItems.map((item) => {
              const isActive = item.activePaths.includes(location.pathname);
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={item.label}
                  className={`group relative flex flex-col items-center justify-center w-13 h-13 rounded-2xl transition-all ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-semibold shadow-xs border border-teal-200'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/80'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-teal-600' : ''}`} />
                  <span className="text-[9.5px] mt-1 font-medium tracking-tight truncate max-w-[48px]">
                    {item.label}
                  </span>

                  {/* Active Pill Indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-teal-600 rounded-r-full" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100 w-full flex flex-col items-center">
            <button
              onClick={() => navigate('/portfolio')}
              title="Verified Credential Portfolio"
              className="p-2.5 rounded-2xl text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
            >
              <ShieldCheck className="w-5 h-5" />
            </button>
          </div>
        </aside>

        {/* Mobile Slide-in Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex">
            <div className="w-64 bg-white h-full p-4 space-y-4 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="font-bold text-gray-900">Navigation</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-gray-500 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1 flex-1">
                {navItems.map((item) => {
                  const isActive = item.activePaths.includes(location.pathname);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-gray-100">
                <Link
                  to="/industry/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  <Building className="w-4 h-4" />
                  <span>For Business</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
