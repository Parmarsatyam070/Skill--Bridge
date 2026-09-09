import React, { createContext, useContext, useRef } from 'react';
import { useExamIntegrity } from '../../hooks/useExamIntegrity';
import { ExamIntegrityWarning } from './ExamIntegrityWarning';
import { ExamSuspensionOverlay } from './ExamSuspensionOverlay';
import {
  ExamIntegrityEventType,
  ExamIntegritySessionType,
} from '../../../../shared/types';

interface ExamIntegrityContextType {
  isSuspended: boolean;
  remainingSeconds: number;
  violationCount: number;
  reportEvent: (eventType: ExamIntegrityEventType, safeMetadata?: Record<string, any>) => Promise<void>;
  checkStatus: () => Promise<void>;
}

const ExamIntegrityContext = createContext<ExamIntegrityContextType | null>(null);

export const useExamIntegrityContext = () => {
  const ctx = useContext(ExamIntegrityContext);
  if (!ctx) {
    throw new Error('useExamIntegrityContext must be used within an ExamIntegrityGuard');
  }
  return ctx;
};

interface ExamIntegrityGuardProps {
  sessionId: string;
  sessionType: ExamIntegritySessionType;
  enabled?: boolean;
  children: React.ReactNode;
  onSuspended?: (until: string) => void;
  className?: string;
}

export const ExamIntegrityGuard: React.FC<ExamIntegrityGuardProps> = ({
  sessionId,
  sessionType,
  enabled = true,
  children,
  onSuspended,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    warning,
    suspension,
    remainingSeconds,
    violationCount,
    reportEvent,
    dismissWarning,
    checkStatus,
    isSuspended,
  } = useExamIntegrity({
    sessionId,
    sessionType,
    enabled,
    containerRef,
    onSuspended,
  });

  return (
    <ExamIntegrityContext.Provider
      value={{
        isSuspended,
        remainingSeconds,
        violationCount,
        reportEvent,
        checkStatus,
      }}
    >
      <div
        ref={containerRef}
        className={`relative ${isSuspended ? 'select-none pointer-events-none' : ''} ${className}`}
        style={{ userSelect: enabled ? 'none' : 'auto' }}
      >
        {children}

        {/* First violation warning banner */}
        <ExamIntegrityWarning
          visible={warning.visible && !isSuspended}
          eventType={warning.eventType}
          message={warning.message}
          onDismiss={dismissWarning}
        />

        {/* Second violation 5-minute suspension overlay */}
        <ExamSuspensionOverlay
          isSuspended={isSuspended}
          remainingSeconds={remainingSeconds}
          reason={suspension.reason}
          onRefreshStatus={checkStatus}
        />
      </div>
    </ExamIntegrityContext.Provider>
  );
};
