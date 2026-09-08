import React from 'react';
import type { GapSeverityLevel } from '@shared/types';

interface GapSeverityBadgeProps {
  severity: GapSeverityLevel;
}

export const GapSeverityBadge: React.FC<GapSeverityBadgeProps> = ({ severity }) => {
  const config = {
    CRITICAL: {
      label: 'Critical Gap',
      bg: 'rgba(229, 99, 124, 0.15)',
      text: '#E5637C',
      border: 'rgba(229, 99, 124, 0.3)',
    },
    HIGH: {
      label: 'High Gap',
      bg: 'rgba(232, 162, 60, 0.15)',
      text: '#E8A23C',
      border: 'rgba(232, 162, 60, 0.3)',
    },
    MEDIUM: {
      label: 'Medium Gap',
      bg: 'rgba(91, 155, 217, 0.15)',
      text: '#5B9BD9',
      border: 'rgba(91, 155, 217, 0.3)',
    },
    LOW: {
      label: 'Low Gap',
      bg: 'rgba(76, 195, 138, 0.15)',
      text: '#4CC38A',
      border: 'rgba(76, 195, 138, 0.3)',
    },
  }[severity] || {
    label: severity,
    bg: 'rgba(139, 144, 160, 0.15)',
    text: '#8B90A0',
    border: 'rgba(139, 144, 160, 0.3)',
  };

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
      }}
    >
      {config.label}
    </span>
  );
};
