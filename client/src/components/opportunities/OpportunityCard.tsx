import React from 'react';
import {
  Building2,
  MapPin,
  Clock,
  Bookmark,
  BookmarkCheck,
  Send,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ArrowUpRight,
  ExternalLink,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { OpportunitySummary, OpportunityMatchItem } from '@shared/types';

interface OpportunityCardProps {
  opportunity: OpportunitySummary;
  matchItem?: OpportunityMatchItem;
  isSaved?: boolean;
  isApplied?: boolean;
  onSaveToggle: (id: string, e: React.MouseEvent) => void;
  onApply: (opportunity: OpportunitySummary, e: React.MouseEvent) => void;
  onViewDetail: (id: string) => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  matchItem,
  isSaved = false,
  isApplied = false,
  onSaveToggle,
  onApply,
  onViewDetail,
}) => {
  const typeBadgeStyles: Record<string, string> = {
    JOB: 'bg-[#2F8C82]/15 text-[#2F8C82] border-[#2F8C82]/30',
    INTERNSHIP: 'bg-[#5B7FE0]/15 text-[#5B7FE0] border-[#5B7FE0]/30',
    APPRENTICESHIP: 'bg-[#9F7AEA]/15 text-[#9F7AEA] border-[#9F7AEA]/30',
    PROJECT: 'bg-[#4CC38A]/15 text-[#4CC38A] border-[#4CC38A]/30',
    TRAINING: 'bg-[#E8A23C]/15 text-[#E8A23C] border-[#E8A23C]/30',
    HACKATHON: 'bg-[#E5637C]/15 text-[#E5637C] border-[#E5637C]/30',
  };

  const badgeClass = typeBadgeStyles[opportunity.type] || 'bg-[#1A1D24] text-[#8B90A0] border-[#2A2E38]';

  // Format deadline
  const deadlineText = opportunity.applicationDeadline
    ? new Date(opportunity.applicationDeadline).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      onClick={() => onViewDetail(opportunity.id)}
      className="group relative p-6 rounded-2xl bg-[#111318] border border-[#2A2E38] hover:border-[#3d4352] hover:bg-[#141720] transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 shadow-sm hover:shadow-xl"
    >
      {/* Top Bar: Company, Type & Save Toggle */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#1A1D24] border border-[#2A2E38] flex items-center justify-center text-[#2F8C82] font-bold text-sm shrink-0">
              {opportunity.company.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#8B90A0] group-hover:text-[#F4F5F7] transition-colors">
                  {opportunity.company.name}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badgeClass}`}>
                  {opportunity.type}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#F4F5F7] mt-0.5 group-hover:text-[#2F8C82] transition-colors line-clamp-1">
                {opportunity.title}
              </h3>
            </div>
          </div>

          {/* Bookmark Button */}
          <button
            onClick={(e) => onSaveToggle(opportunity.id, e)}
            className={`p-2 rounded-xl border transition-colors ${
              isSaved
                ? 'bg-[#2F8C82]/15 text-[#2F8C82] border-[#2F8C82]/40'
                : 'bg-[#1A1D24] text-[#8B90A0] border-[#2A2E38] hover:text-[#F4F5F7] hover:border-[#3d4352]'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save opportunity'}
          >
            {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>

        {/* Metadata Pill Row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[#8B90A0] mt-3">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#8B90A0]/80" />
            <span>{opportunity.location}</span>
            <span className="text-[10px] text-[#2F8C82] font-medium">({opportunity.workMode})</span>
          </span>

          {opportunity.stipend && (
            <>
              <span className="text-[#2A2E38]">•</span>
              <span className="flex items-center gap-1 text-[#F4F5F7]">
                <span>{opportunity.stipend}</span>
              </span>
            </>
          )}

          {opportunity.duration && (
            <>
              <span className="text-[#2A2E38]">•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#8B90A0]/80" />
                <span>{opportunity.duration}</span>
              </span>
            </>
          )}

          {deadlineText && (
            <>
              <span className="text-[#2A2E38]">•</span>
              <span className="flex items-center gap-1 text-xs">
                <Calendar className="w-3 h-3 text-[#E8A23C]" />
                <span className="text-[#8B90A0]">Deadline: {deadlineText}</span>
              </span>
            </>
          )}
        </div>

        {/* Short Description */}
        <p className="text-xs text-[#8B90A0] mt-3 line-clamp-2 leading-relaxed">
          {opportunity.description}
        </p>
      </div>

      {/* Skills Pill List */}
      <div>
        <div className="flex flex-wrap items-center gap-1.5">
          {opportunity.requiredSkills.slice(0, 5).map((rs, idx) => (
            <span
              key={idx}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border flex items-center gap-1 ${
                rs.isMandatory
                  ? 'bg-[#1A1D24] text-[#F4F5F7] border-[#2A2E38]'
                  : 'bg-[#111318] text-[#8B90A0] border-[#2A2E38]/60'
              }`}
            >
              {rs.isMandatory && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#2F8C82]" title="Mandatory Requirement" />
              )}
              <span>{rs.skillName || 'Skill'}</span>
              {rs.isMandatory && (
                <span className="text-[9px] uppercase font-bold text-[#2F8C82]">Req</span>
              )}
            </span>
          ))}

          {opportunity.requiredSkills.length > 5 && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] text-[#8B90A0] bg-[#1A1D24] border border-[#2A2E38]">
              +{opportunity.requiredSkills.length - 5} more
            </span>
          )}
        </div>
      </div>

      {/* Footer: Match Badge & Action Buttons */}
      <div className="pt-3 border-t border-[#2A2E38] flex items-center justify-between gap-3">
        {/* Authoritative Match & Eligibility Badge */}
        {matchItem ? (
          <div className="flex items-center gap-2">
            <div
              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 text-xs font-bold font-mono ${
                matchItem.tier === 'high'
                  ? 'bg-[#4CC38A]/10 text-[#4CC38A] border-[#4CC38A]/30'
                  : matchItem.tier === 'medium'
                  ? 'bg-[#E8A23C]/10 text-[#E8A23C] border-[#E8A23C]/30'
                  : 'bg-[#E5637C]/10 text-[#E5637C] border-[#E5637C]/30'
              }`}
            >
              <span>{matchItem.score}%</span>
              <span className="text-[10px] uppercase font-sans font-medium text-[#8B90A0]">Match</span>
            </div>

            {matchItem.eligibility ? (
              <span
                className="px-2 py-1 rounded-lg bg-[#4CC38A]/10 text-[#4CC38A] border border-[#4CC38A]/30 text-[10px] font-semibold flex items-center gap-1"
                title="All mandatory requirements satisfied"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Eligible</span>
              </span>
            ) : (
              <span
                className="px-2 py-1 rounded-lg bg-[#E8A23C]/10 text-[#E8A23C] border border-[#E8A23C]/30 text-[10px] font-semibold flex items-center gap-1"
                title={matchItem.ineligibilityReason || 'Mandatory skills missing'}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Ineligible</span>
              </span>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-[#8B90A0] flex items-center gap-1">
            <span>{opportunity.applicantCount || 0} applicants</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-2">
          {isApplied ? (
            <span className="px-3.5 py-1.5 rounded-xl bg-[#4CC38A]/10 border border-[#4CC38A]/30 text-[#4CC38A] text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Applied</span>
            </span>
          ) : (
            <button
              onClick={(e) => onApply(opportunity, e)}
              className="px-4 py-1.5 rounded-xl bg-[#2F8C82] hover:bg-[#3aa398] text-[#F4F5F7] text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-[#2F8C82]/15 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Apply</span>
            </button>
          )}

          <button
            onClick={() => onViewDetail(opportunity.id)}
            className="p-1.5 rounded-xl bg-[#1A1D24] text-[#8B90A0] hover:text-[#F4F5F7] border border-[#2A2E38] hover:border-[#3d4352] transition-colors"
            title="View Details"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
