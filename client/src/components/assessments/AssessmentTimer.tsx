import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface AssessmentTimerProps {
  initialSeconds: number;
  onExpire: () => void;
  className?: string;
}

export const AssessmentTimer: React.FC<AssessmentTimerProps> = ({
  initialSeconds,
  onExpire,
  className = '',
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpire();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onExpire]);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const isLowTime = secondsLeft < 300; // < 5 minutes
  const isCriticalTime = secondsLeft < 120; // < 2 minutes

  const formatTime = () => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={`Time remaining: ${formatTime()}`}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-semibold border transition-all ${
        isCriticalTime
          ? 'bg-rose-500/15 text-rose-400 border-rose-500/50 animate-pulse'
          : isLowTime
          ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
          : 'bg-[#0f172a] text-blue-400 border-[#1e293b]'
      } ${className}`}
    >
      {isCriticalTime ? (
        <AlertTriangle className="w-4 h-4 text-rose-400" />
      ) : (
        <Clock className={`w-4 h-4 ${isLowTime ? 'text-amber-400' : 'text-blue-400'}`} />
      )}
      <span>{formatTime()}</span>
    </div>
  );
};
