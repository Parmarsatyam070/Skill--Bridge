import React, { useLayoutEffect, useRef, useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const EXCLUDED_ROUTES = ['/portfolio', '/portfolio-builder', '/dsa'];
const isExcludedRoute = (pathname: string, search: string = '') =>
  EXCLUDED_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/')) ||
  (pathname === '/assessment' && search.includes('runner='));

export const ScrollRestorationManager: React.FC = () => {
  const location = useLocation();
  const navigationType = useNavigationType();

  const scrollPositions = useRef<Map<string, number>>(new Map());
  const prevPathKeyRef = useRef<string>(location.pathname + location.search);

  // Helper to get active scroll container
  const getScrollContainer = (): Element | (Window & typeof globalThis) => {
    const mainContent = document.getElementById('console-main-content');
    if (mainContent) return mainContent;
    return window;
  };

  const getScrollTop = (container: Element | (Window & typeof globalThis)): number => {
    if (container === window) {
      return window.scrollY || document.documentElement.scrollTop || 0;
    }
    return (container as Element).scrollTop || 0;
  };

  const setScrollTop = (container: Element | (Window & typeof globalThis), top: number) => {
    if (container === window) {
      window.scrollTo(0, top);
    } else {
      (container as Element).scrollTop = top;
    }
  };

  // Passive capture scroll listener throttled with requestAnimationFrame to prevent layout thrashing
  useEffect(() => {
    let ticking = false;
    let rafId: number | null = null;

    const handleScroll = () => {
      // Excluded routes manage their own internal pane scrolling
      if (isExcludedRoute(location.pathname, location.search)) return;

      if (!ticking) {
        ticking = true;
        rafId = window.requestAnimationFrame(() => {
          const container = getScrollContainer();
          const top = getScrollTop(container);
          const currentKey = location.pathname + location.search;
          scrollPositions.current.set(currentKey, top);
          scrollPositions.current.set(location.pathname, top);
          ticking = false;
        });
      }
    };

    // Capture listener ensures scroll events from #console-main-content are caught regardless of mount timing
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [location.pathname, location.search]);

  // Manage restoration on route change
  useLayoutEffect(() => {
    const currentKey = location.pathname + location.search;
    const prevKey = prevPathKeyRef.current;
    const prevPathname = prevKey ? prevKey.split('?')[0] : '';
    const prevSearch = prevKey && prevKey.includes('?') ? '?' + prevKey.split('?')[1] : '';

    // If current route is excluded (e.g. split-screen portfolio builder or DSA coding runner),
    // ensure the outer console-main-content stays at 0 and skip global restoration.
    if (isExcludedRoute(location.pathname, location.search)) {
      const container = getScrollContainer();
      setScrollTop(container, 0);
      prevPathKeyRef.current = currentKey;
      return;
    }

    // Save previous route's scroll position before switching (if not an excluded route)
    if (prevKey && prevKey !== currentKey && !isExcludedRoute(prevPathname, prevSearch)) {
      const container = getScrollContainer();
      const currentTop = getScrollTop(container);
      scrollPositions.current.set(prevKey, currentTop);
      scrollPositions.current.set(prevPathname, currentTop);
    }

    // CRITICAL: If the pathname has NOT changed (e.g., background polling refetch,
    // state update, or search query change while remaining on the same page),
    // NEVER reset scroll to 0!
    if (prevPathname === location.pathname) {
      prevPathKeyRef.current = currentKey;
      return;
    }

    const container = getScrollContainer();

    // Check if this navigation is a "start fresh" action
    const isFreshAction =
      // 1. Starting a specific practice set assessment attempt (e.g. /assessment?setId=...)
      (location.pathname.startsWith('/assessment') && location.search.includes('setId=')) ||
      // 2. Starting a specific DSA problem attempt via URL slug (e.g. /dsa/two-sum) via PUSH navigation
      (location.pathname.startsWith('/dsa/') && location.pathname !== '/dsa' && navigationType === 'PUSH') ||
      // 3. Opening a specific job applicant list or posting job via PUSH
      (location.pathname.includes('/industry/applicants/') && navigationType === 'PUSH');

    if (isFreshAction) {
      // Intentionally scroll to top for fresh item/attempt starts
      setScrollTop(container, 0);
    } else {
      // Check if we have a saved scroll position for returning to this exact route or pathname
      const savedTop = scrollPositions.current.get(currentKey) ?? scrollPositions.current.get(location.pathname);

      if (savedTop !== undefined && (navigationType === 'POP' || scrollPositions.current.has(currentKey) || scrollPositions.current.has(location.pathname))) {
        // Use requestAnimationFrame to ensure DOM is rendered before applying scroll
        requestAnimationFrame(() => {
          setScrollTop(container, savedTop);
        });
      } else {
        // Default new routes to top
        setScrollTop(container, 0);
      }
    }

    prevPathKeyRef.current = currentKey;
  }, [location.pathname, location.search, navigationType]);

  return null;
};
