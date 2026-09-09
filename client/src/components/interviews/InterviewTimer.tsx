import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface InterviewTimerProps {
  onTick?: (seconds: number) => void;
  className?: string;
}

export const InterviewTimer: React.FC<InterviewTimerProps> = ({
  onTick,
  className = '',
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => {
        const next = prev + 1;
        if (onTick) onTick(next);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTick]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0b1329] border border-[#1e293b] text-xs font-mono text-slate-300 shadow-sm ${className}`}
    >
      <Clock className="w-3.5 h-3.5 text-blue-400" />
      <span>Session Time: {formatTime(seconds)}</span>
    </div>
  );
};
