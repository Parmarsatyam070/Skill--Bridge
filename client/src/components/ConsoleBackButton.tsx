import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/profile': 'Career Profile',
  '/skill-profile': 'Skill Profile',
  '/assessment': 'Skill Assessment',
  '/assessments': 'Talent Assessments',
  '/dsa': 'DSA & Coding',
  '/learn': 'Learning Hub',
  '/report-card': 'Report Card',
  '/internships': 'Matched Internships',
  '/opportunities': 'Opportunity Hub',
  '/interviews': 'AI Interviews',
  '/courses': 'Partner Courses',
  '/resume-builder': 'AI Resume Builder',
  '/portfolio': 'Portfolio Website',
  '/portfolio-builder': 'Portfolio Builder',
  '/industry/dashboard': 'Recruitment Hub',
  '/industry/intelligence': 'Market Intelligence',
  '/industry/post-job': 'Post Internship',
  '/academician/dashboard': 'Academia Hub',
  '/academician/opportunities': 'Opportunities',
  '/institution/dashboard': 'Institutional Analytics',
  '/institution/intelligence': 'Skill Intelligence',
  '/collaborations': 'Collaborations',
};

export const getLabelForPath = (pathWithSearch: string): string => {
  if (!pathWithSearch) return 'Previous Page';
  const pathname = pathWithSearch.split('?')[0];

  // Specific query label overrides
  if (pathname === '/assessment') {
    return 'Skill Assessment';
  }
  if (pathname === '/assessments') {
    return 'Talent Assessments';
  }

  if (ROUTE_LABELS[pathname]) {
    return ROUTE_LABELS[pathname];
  }
  if (pathname.startsWith('/dsa')) {
    return 'DSA & Coding';
  }
  if (pathname.startsWith('/opportunities')) {
    return 'Opportunity Hub';
  }
  if (pathname.startsWith('/assessments')) {
    return 'Talent Assessments';
  }
  if (pathname.startsWith('/assessment')) {
    return 'Skill Assessment';
  }
  if (pathname.startsWith('/p/')) {
    return 'Portfolio';
  }
  if (pathname.startsWith('/interviews')) {
    return 'AI Interviews';
  }
  if (pathname.startsWith('/collaborations')) {
    return 'Collaborations';
  }
  if (pathname.startsWith('/industry/')) {
    return 'Industry Hub';
  }
  return 'Previous Page';
};

const STORAGE_KEY = 'skillbridge_nav_stack';

const loadStack = (): string[] => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
};

const saveStack = (stack: string[]) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stack.slice(-25)));
  } catch {}
};

export const ConsoleBackButton: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [previousLabel, setPreviousLabel] = useState<string | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Current full path identifier including search query
    const currentKey = location.pathname + (location.search || '');
    const stack = loadStack();

    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (stack.length === 0 || stack[stack.length - 1] !== currentKey) {
        stack.push(currentKey);
      }
    } else {
      const lastIndex = stack.length - 1;
      if (lastIndex >= 0 && stack[lastIndex] === currentKey) {
        // Same route / no change
      } else if (lastIndex >= 1 && stack[lastIndex - 1] === currentKey) {
        // Navigated back via POP
        stack.pop();
      } else {
        // New route pushed
        stack.push(currentKey);
      }
    }

    saveStack(stack);

    // Determine the previous route label from stack
    if (stack.length >= 2) {
      const prevPath = stack[stack.length - 2];
      setPreviousLabel(getLabelForPath(prevPath));
    } else if (location.pathname === '/assessment' && location.search.includes('runner=')) {
      // Direct load of runner without preceding stack
      setPreviousLabel('Skill Assessment');
    } else if (window.history.length > 1 && location.pathname !== '/dashboard') {
      setPreviousLabel('Previous Page');
    } else {
      setPreviousLabel(null);
    }
  }, [location.pathname, location.search]);

  const handleBackClick = () => {
    const stack = loadStack();
    if (stack.length >= 2) {
      const target = stack[stack.length - 2];
      // Pop current from stack before navigating
      stack.pop();
      saveStack(stack);
      navigate(-1);
    } else if (location.pathname === '/assessment' && location.search.includes('runner=')) {
      navigate('/assessment', { replace: true });
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  // If at root dashboard and there is no previous in-app history, omit the button
  const isRootDashboard =
    location.pathname === '/dashboard' ||
    location.pathname === '/industry/dashboard' ||
    location.pathname === '/academician/dashboard' ||
    location.pathname === '/institution/dashboard';

  if (!previousLabel && isRootDashboard) {
    return null;
  }

  const labelText = previousLabel || 'Previous Page';

  return (
    <div className="flex items-center gap-2 mb-3.5 shrink-0 animate-fade-in">
      <button
        type="button"
        onClick={handleBackClick}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1A1D24] hover:bg-[#2A2E38] text-[#8B90A0] hover:text-[#F4F5F7] border border-bridge-border hover:border-[#2F8C82]/40 transition-all cursor-pointer group shadow-xs text-xs font-mono"
        title={`Navigate back to ${labelText}`}
      >
        <ArrowLeft className="w-3.5 h-3.5 text-[#2F8C82] group-hover:-translate-x-0.5 transition-transform" />
        <span className="font-medium text-[#8B90A0] group-hover:text-[#F4F5F7] transition-colors">
          Back to {labelText}
        </span>
      </button>
    </div>
  );
};

