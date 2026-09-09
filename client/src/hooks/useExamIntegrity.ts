import { useState, useEffect, useRef, useCallback } from 'react';
import { apiRequest } from '../lib/api';
import {
  ExamIntegrityEventType,
  ExamIntegritySessionType,
  ExamSuspensionState,
  ExamIntegrityResponse,
  ExamIntegrityStatusDto,
} from '../../../shared/types';

interface UseExamIntegrityOptions {
  sessionId: string;
  sessionType: ExamIntegritySessionType;
  enabled?: boolean;
  containerRef?: React.RefObject<HTMLElement | null>;
  onSuspended?: (until: string) => void;
  onWarning?: (eventType: ExamIntegrityEventType) => void;
}

interface IntegrityWarningState {
  visible: boolean;
  eventType: ExamIntegrityEventType | null;
  message: string;
}

export function useExamIntegrity({
  sessionId,
  sessionType,
  enabled = true,
  containerRef,
  onSuspended,
  onWarning,
}: UseExamIntegrityOptions) {
  const [warning, setWarning] = useState<IntegrityWarningState>({
    visible: false,
    eventType: null,
    message: '',
  });

  const [suspension, setSuspension] = useState<ExamSuspensionState>({
    isSuspended: false,
  });

  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [violationCount, setViolationCount] = useState<number>(0);

  const lastEventRef = useRef<{ type: string; time: number }>({ type: '', time: 0 });
  const isSuspendedRef = useRef(false);
  isSuspendedRef.current = suspension.isSuspended;

  // Sync remaining countdown from server suspendedUntil
  useEffect(() => {
    if (!suspension.isSuspended || !suspension.suspendedUntil) {
      setRemainingSeconds(0);
      return;
    }

    const calculateRemaining = () => {
      const until = new Date(suspension.suspendedUntil!).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((until - now) / 1000));
      return diff;
    };

    setRemainingSeconds(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        // Verify with server that suspension has expired
        checkStatus();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [suspension.isSuspended, suspension.suspendedUntil]);

  // Check initial / refresh status from server
  const checkStatus = useCallback(async () => {
    if (!sessionId || !enabled) return;
    try {
      const res = await apiRequest<{ success: boolean; data: ExamIntegrityStatusDto }>(
        `/integrity/status?sessionId=${encodeURIComponent(sessionId)}&sessionType=${encodeURIComponent(sessionType)}`
      );

      if (res?.data) {
        setViolationCount(res.data.violationCount);
        if (res.data.isSuspended && res.data.suspendedUntil) {
          setSuspension({
            isSuspended: true,
            suspendedAt: res.data.suspendedAt,
            suspendedUntil: res.data.suspendedUntil,
            reason: res.data.reason,
            violationCount: res.data.violationCount,
          });
          onSuspended?.(res.data.suspendedUntil);
        } else {
          setSuspension({ isSuspended: false });
        }
      }
    } catch (err) {
      console.warn('[ExamIntegrity] Failed to check status:', err);
    }
  }, [sessionId, sessionType, enabled, onSuspended]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Report integrity event to server
  const reportEvent = useCallback(
    async (eventType: ExamIntegrityEventType, safeMetadata?: Record<string, any>) => {
      if (!enabled || !sessionId) return;

      const now = Date.now();
      // Client-side 800ms deduplication per event type
      if (lastEventRef.current.type === eventType && now - lastEventRef.current.time < 800) {
        return;
      }
      lastEventRef.current = { type: eventType, time: now };

      try {
        const res = await apiRequest<{ success: boolean; data: ExamIntegrityResponse }>(
          '/integrity/events',
          {
            method: 'POST',
            body: JSON.stringify({
              sessionId,
              sessionType,
              eventType,
              metadata: safeMetadata,
            }),
          }
        );

        if (res?.data) {
          const { action, violationCount: vCount, suspension: susp, message } = res.data;
          setViolationCount(vCount);

          if (action === 'WARNING') {
            setWarning({
              visible: true,
              eventType,
              message:
                message ||
                `A prohibited action was detected: ${eventType.replace(/_/g, ' ')}. This is your first warning. A further prohibited action may temporarily suspend your assessment access.`,
            });
            onWarning?.(eventType);
          } else if (action === 'SUSPENDED' && susp) {
            setSuspension({
              isSuspended: true,
              suspendedAt: susp.suspendedAt,
              suspendedUntil: susp.suspendedUntil,
              reason: susp.reason,
              violationCount: vCount,
            });
            setWarning({ visible: false, eventType: null, message: '' });
            if (susp.suspendedUntil) {
              onSuspended?.(susp.suspendedUntil);
            }
          }
        }
      } catch (err: any) {
        // If 403 EXAM_ACCESS_SUSPENDED returned
        if (err?.code === 'EXAM_ACCESS_SUSPENDED' || err?.message?.includes('SUSPENDED')) {
          checkStatus();
        } else {
          console.warn('[ExamIntegrity] Error reporting event:', err);
        }
      }
    },
    [enabled, sessionId, sessionType, onWarning, onSuspended, checkStatus]
  );

  const dismissWarning = useCallback(() => {
    setWarning(prev => ({ ...prev, visible: false }));
  }, []);

  // DOM Event Listeners for Protected Container
  useEffect(() => {
    if (!enabled || !sessionId) return;

    const target = containerRef?.current || document;

    const handleCopy = (e: Event) => {
      e.preventDefault();
      reportEvent('COPY_ATTEMPT');
    };

    const handlePaste = (e: Event) => {
      e.preventDefault();
      reportEvent('PASTE_ATTEMPT');
    };

    const handleCut = (e: Event) => {
      e.preventDefault();
      reportEvent('CUT_ATTEMPT');
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      reportEvent('CONTEXT_MENU_ATTEMPT');
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      reportEvent('DRAG_DROP_ATTEMPT');
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      reportEvent('DRAG_DROP_ATTEMPT');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // PrintScreen / Screenshot attempts
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        reportEvent('PRINT_SCREEN_ATTEMPT');
        return;
      }

      // Detect Print (Ctrl+P / Meta+P)
      if (cmdOrCtrl && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        reportEvent('PRINT_SCREEN_ATTEMPT');
        return;
      }

      // Mac screenshot shortcut detection (Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5)
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        reportEvent('SCREENSHOT_ATTEMPT');
        return;
      }

      // Prohibited Clipboard Shortcuts
      if (cmdOrCtrl) {
        if (e.shiftKey && (e.key === 'v' || e.key === 'V')) {
          e.preventDefault();
          reportEvent('FORCE_PASTE_ATTEMPT');
        } else if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          reportEvent('PASTE_ATTEMPT');
        } else if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          reportEvent('COPY_ATTEMPT');
        } else if (e.key === 'x' || e.key === 'X') {
          e.preventDefault();
          reportEvent('CUT_ATTEMPT');
        }
      }
    };

    // Observational Listeners (Window / Visibility)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportEvent('VISIBILITY_CHANGE');
        reportEvent('TAB_SWITCH');
      }
    };

    const handleWindowBlur = () => {
      reportEvent('WINDOW_BLUR');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        reportEvent('FULLSCREEN_EXIT');
      }
    };

    // Attach listeners
    target.addEventListener('copy', handleCopy);
    target.addEventListener('paste', handlePaste);
    target.addEventListener('cut', handleCut);
    target.addEventListener('contextmenu', handleContextMenu as EventListener);
    target.addEventListener('dragstart', handleDragStart as EventListener);
    target.addEventListener('drop', handleDrop as EventListener);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      target.removeEventListener('copy', handleCopy);
      target.removeEventListener('paste', handlePaste);
      target.removeEventListener('cut', handleCut);
      target.removeEventListener('contextmenu', handleContextMenu as EventListener);
      target.removeEventListener('dragstart', handleDragStart as EventListener);
      target.removeEventListener('drop', handleDrop as EventListener);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [enabled, sessionId, containerRef, reportEvent]);

  return {
    warning,
    suspension,
    remainingSeconds,
    violationCount,
    reportEvent,
    dismissWarning,
    checkStatus,
    isSuspended: suspension.isSuspended,
  };
}
