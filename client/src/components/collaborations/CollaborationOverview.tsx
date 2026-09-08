import React from 'react';
import type { CollaborationDetailDto } from '@shared/types';
import { CollaborationStatusBadge } from './CollaborationStatusBadge';
import { CollaborationStatusActions } from './CollaborationStatusActions';
import {
  Building2,
  GraduationCap,
  Calendar,
  Layers,
  Sparkles,
  Globe,
  Tag,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  collaboration: CollaborationDetailDto;
  currentUserRole?: string;
}

export const CollaborationOverview: React.FC<Props> = ({
  collaboration,
  currentUserRole,
}) => {
  let parsedSkills: string[] = [];
  if (collaboration.skillsJson) {
    try {
      const parsed = JSON.parse(collaboration.skillsJson);
      if (Array.isArray(parsed)) parsedSkills = parsed;
    } catch {}
  }

  const createdFormatted = new Date(collaboration.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const updatedFormatted = new Date(collaboration.updatedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const startDateFormatted = collaboration.startDate
    ? new Date(collaboration.startDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const endDateFormatted = collaboration.endDate
    ? new Date(collaboration.endDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#111318] border border-[#2A2E38] rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#2F8C82]/15 text-[#4CC38A] border border-[#2F8C82]/30">
                {collaboration.type.replace('_', ' ')}
              </span>
              <CollaborationStatusBadge status={collaboration.status} />
              <span className="text-xs text-zinc-500 font-mono">
                Initiated by {collaboration.initiatedByRole.toLowerCase()}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F4F5F7] tracking-tight">
              {collaboration.title}
            </h1>
          </div>
        </div>

        {/* Status Actions bar */}
        <div className="pt-4 border-t border-[#2A2E38]/80">
          <CollaborationStatusActions
            collaboration={collaboration}
            currentUserRole={currentUserRole}
          />
        </div>
      </div>

      {/* Participants Dual Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Industry Partner */}
        <div className="bg-[#111318] border border-[#2A2E38] rounded-xl p-4 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold block mb-0.5">
              Industry Partner
            </span>
            <h4 className="text-sm font-semibold text-[#F4F5F7] truncate">
              {collaboration.company?.companyName || 'Company'}
            </h4>
            {collaboration.company?.industrySector && (
              <p className="text-xs text-zinc-400 mt-0.5">
                Sector: {collaboration.company.industrySector}
              </p>
            )}
            {collaboration.company?.website && (
              <a
                href={
                  collaboration.company.website.startsWith('http')
                    ? collaboration.company.website
                    : `https://${collaboration.company.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#2F8C82] hover:underline mt-1.5"
              >
                <Globe className="w-3 h-3" />
                <span>Visit Website</span>
              </a>
            )}
          </div>
        </div>

        {/* Academic Institution */}
        <div className="bg-[#111318] border border-[#2A2E38] rounded-xl p-4 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-300 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block mb-0.5">
              Academic Institution
            </span>
            <h4 className="text-sm font-semibold text-[#F4F5F7] truncate">
              {collaboration.institution?.institutionName || 'Institution'}
            </h4>
            {collaboration.institution?.adminDesignation && (
              <p className="text-xs text-zinc-400 mt-0.5">
                Representative: {collaboration.institution.adminDesignation}
              </p>
            )}
            {collaboration.targetDepartment && (
              <p className="text-xs text-zinc-400 mt-0.5">
                Dept: {collaboration.targetDepartment}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Description & Purpose */}
      <div className="bg-[#111318] border border-[#2A2E38] rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-[#F4F5F7] flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#2F8C82]" />
          <span>Scope & Objectives</span>
        </h3>
        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {collaboration.description}
        </p>

        {/* Skills alignment tags */}
        {parsedSkills.length > 0 && (
          <div className="pt-3 border-t border-[#2A2E38]">
            <span className="text-xs text-zinc-400 block mb-2 font-medium">
              Target Skills & Technologies
            </span>
            <div className="flex flex-wrap gap-1.5">
              {parsedSkills.map((sk, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-[#1A1D24] border border-[#2A2E38] text-xs text-zinc-300 flex items-center gap-1"
                >
                  <Tag className="w-3 h-3 text-[#2F8C82]" />
                  {sk}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Timeline & Metadata */}
      <div className="bg-[#111318] border border-[#2A2E38] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[#F4F5F7] flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-[#2F8C82]" />
          <span>Schedule & Timeline</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-[#161920] border border-[#2A2E38] rounded-xl">
            <span className="text-zinc-500 block mb-1">Proposed Timeline</span>
            <span className="font-semibold text-zinc-200">
              {collaboration.proposedDate || 'Flexible / To be discussed'}
            </span>
          </div>

          <div className="p-3 bg-[#161920] border border-[#2A2E38] rounded-xl">
            <span className="text-zinc-500 block mb-1">Active Duration</span>
            <span className="font-semibold text-zinc-200">
              {startDateFormatted
                ? `${startDateFormatted} — ${endDateFormatted || 'Ongoing'}`
                : 'Not scheduled yet'}
            </span>
          </div>

          <div className="p-3 bg-[#161920] border border-[#2A2E38] rounded-xl">
            <span className="text-zinc-500 block mb-1">Proposed Date</span>
            <span className="font-semibold text-zinc-200">{createdFormatted}</span>
          </div>

          <div className="p-3 bg-[#161920] border border-[#2A2E38] rounded-xl">
            <span className="text-zinc-500 block mb-1">Last Update</span>
            <span className="font-semibold text-zinc-200">{updatedFormatted}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
