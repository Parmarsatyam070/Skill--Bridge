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
    JOB: 'bg-blue-600/15 text-blue-400 border-blue-500/30',
    INTERNSHIP: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    APPRENTICESHIP: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    PROJECT: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    TRAINING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    HACKATHON: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  };

  const badgeClass = typeBadgeStyles[opportunity.type] || 'bg-[#0f172a] text-slate-400 border-[#1e293b]';

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
      className="group relative p-6 rounded-2xl bg-[#0b1329] border border-[#1e293b] hover:border-blue-500/50 hover:bg-[#0d172e] transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 shadow-sm hover:shadow-xl"
    >
      {/* Top Bar: Company, Type & Save Toggle */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
              {opportunity.company.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 group-hover:text-white transition-colors">
                  {opportunity.company.name}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badgeClass}`}>
                  {opportunity.type}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5 group-hover:text-blue-400 transition-colors line-clamp-1">
                {opportunity.title}
              </h3>
            </div>
          </div>

          {/* Bookmark Button */}
          <button
            onClick={(e) => onSaveToggle(opportunity.id, e)}
            className={`p-2 rounded-xl border transition-colors ${
              isSaved
                ? 'bg-blue-600/15 text-blue-400 border-blue-500/40'
                : 'bg-[#0f172a] text-slate-400 border-[#1e293b] hover:text-white hover:border-slate-600'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save opportunity'}
          >
            {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>

        {/* Metadata Pill Row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-400 mt-3">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400/80" />
            <span>{opportunity.location}</span>
            <span className="text-[10px] text-blue-400 font-medium">({opportunity.workMode})</span>
          </span>

          {opportunity.stipend && (
            <>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-white">
                <span>{opportunity.stipend}</span>
              </span>
            </>
          )}

          {opportunity.duration && (
            <>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400/80" />
                <span>{opportunity.duration}</span>
              </span>
            </>
          )}

          {deadlineText && (
            <>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-xs">
                <Calendar className="w-3 h-3 text-amber-400" />
                <span className="text-slate-400">Deadline: {deadlineText}</span>
              </span>
            </>
          )}
        </div>

        {/* Short Description */}
        <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
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
                  ? 'bg-[#0f172a] text-white border-[#1e293b]'
                  : 'bg-[#0b1329] text-slate-400 border-[#1e293b]/60'
              }`}
            >
              {rs.isMandatory && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Mandatory Requirement" />
              )}
              <span>{rs.skillName || 'Skill'}</span>
              {rs.isMandatory && (
                <span className="text-[9px] uppercase font-bold text-blue-400">Req</span>
              )}
            </span>
          ))}

          {opportunity.requiredSkills.length > 5 && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] text-slate-400 bg-[#0f172a] border border-[#1e293b]">
              +{opportunity.requiredSkills.length - 5} more
            </span>
          )}
        </div>
      </div>

      {/* Footer: Match Badge & Action Buttons */}
      <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between gap-3">
        {/* Authoritative Match & Eligibility Badge */}
        {matchItem ? (
          <div className="flex items-center gap-2">
            <div
              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 text-xs font-bold font-mono ${
                matchItem.tier === 'high'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : matchItem.tier === 'medium'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              <span>{matchItem.score}%</span>
              <span className="text-[10px] uppercase font-sans font-medium text-slate-400">Match</span>
            </div>

            {matchItem.eligibility ? (
              <span
                className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1"
                title="All mandatory requirements satisfied"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Eligible</span>
              </span>
            ) : (
              <span
                className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-semibold flex items-center gap-1"
                title={matchItem.ineligibilityReason || 'Mandatory skills missing'}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Ineligible</span>
              </span>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span>{opportunity.applicantCount || 0} applicants</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-2">
          {isApplied ? (
            <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Applied</span>
            </span>
          ) : (
            <button
              onClick={(e) => onApply(opportunity, e)}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/15 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Apply</span>
            </button>
          )}

          <button
            onClick={() => onViewDetail(opportunity.id)}
            className="p-1.5 rounded-xl bg-[#0f172a] text-slate-400 hover:text-white border border-[#1e293b] hover:border-slate-600 transition-colors"
            title="View Details"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
