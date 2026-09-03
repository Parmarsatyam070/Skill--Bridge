import React from 'react';
import { ExternalLink, Linkedin, Globe, Building2 } from 'lucide-react';

export type ExternalPlatform = 'linkedin' | 'internshala' | 'aicte' | 'hcl';

interface ExternalApplyButtonProps {
  platform: ExternalPlatform;
  query?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const ExternalApplyButton: React.FC<ExternalApplyButtonProps> = ({
  platform,
  query = 'software developer',
  className = '',
  size = 'md',
}) => {
  const platformConfig = {
    linkedin: {
      name: 'LinkedIn Jobs',
      url: `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(query)}&location=India`,
      badge: 'Public Deep-Link',
      note: 'Opens LinkedIn filtered search for this role',
      color: 'hover:border-[#0A66C2] hover:text-[#0A66C2]',
      Icon: Linkedin,
    },
    internshala: {
      name: 'Internshala',
      url: `https://internshala.com/internships/keywords-${encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'))}`,
      badge: 'External Portal',
      note: 'Deep links to Internshala domain search (Phase 2 MoU Track)',
      color: 'hover:border-[#008BDC] hover:text-[#008BDC]',
      Icon: Globe,
    },
    aicte: {
      name: 'AICTE Internship Portal',
      url: 'https://internship.aicte-india.org/',
      badge: 'Govt Portal',
      note: 'Direct link to National AICTE Portal for verified public sector listings',
      color: 'hover:border-status-amber hover:text-status-amber',
      Icon: Building2,
    },
    hcl: {
      name: 'HCL Careers & TechBee',
      url: 'https://www.hcltechbee.com',
      badge: 'Hiring Partner',
      note: 'Direct link to HCL hiring programs',
      color: 'hover:border-campus-blue hover:text-campus-blue',
      Icon: ExternalLink,
    },
  }[platform];

  const IconComponent = platformConfig.Icon;

  return (
    <a
      href={platformConfig.url}
      target="_blank"
      rel="noopener noreferrer"
      title={platformConfig.note}
      className={`inline-flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-console-panel-raised border border-console-border text-console-text-muted hover:text-console-text transition-all duration-150 group text-xs ${platformConfig.color} ${className}`}
    >
      <div className="flex items-center gap-2">
        <IconComponent className="w-3.5 h-3.5 text-console-text-muted group-hover:text-current transition-colors" />
        <span className="font-medium text-console-text group-hover:text-current">
          {platformConfig.name}
        </span>
      </div>
      <div className="flex items-center gap-1.5 opacity-70 group-hover:opacity-100">
        <span className="text-[10px] font-mono text-console-text-muted">
          {platformConfig.badge}
        </span>
        <ExternalLink className="w-3 h-3" />
      </div>
    </a>
  );
};
