import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Calendar,
  Building2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  Award,
  Layers,
  FileText,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../lib/api';
import {
  InstitutionApplicationsResponseDto,
  InstitutionApplicationItemDto,
  ApplicationTimelineEventDto,
} from '@shared/types';
import { MatchBadge } from '../../components/MatchBadge';

export const InstitutionApplicationsPage: React.FC = () => {
  // Filters state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedBatch, setSelectedBatch] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Detail Modal state
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // Fetch paginated applications and real computed KPIs
  const { data, isLoading, isError, refetch } = useQuery<InstitutionApplicationsResponseDto>({
    queryKey: [
      'institutionApplications',
      page,
      search,
      selectedCompany,
      selectedDepartment,
      selectedBatch,
      selectedStatus,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '12');
      if (search.trim()) params.append('search', search.trim());
      if (selectedCompany !== 'ALL') params.append('company', selectedCompany);
      if (selectedDepartment !== 'ALL') params.append('department', selectedDepartment);
      if (selectedBatch !== 'ALL') params.append('batch', selectedBatch);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);

      return await api.get<InstitutionApplicationsResponseDto>(`/institutions/applications?${params.toString()}`);
    },
  });

  // Fetch single application detail with full timeline
  const { data: detailData, isLoading: isDetailLoading } = useQuery<{
    application: InstitutionApplicationItemDto & {
      timeline: ApplicationTimelineEventDto[];
      coverNote?: string;
      resume?: { id: string; title: string; fileUrl?: string } | null;
    };
  }>({
    queryKey: ['institutionApplicationDetail', selectedAppId],
    queryFn: async () => {
      if (!selectedAppId) return null as any;
      return await api.get(`/institutions/applications/${selectedAppId}`);
    },
    enabled: !!selectedAppId,
  });

  const kpis = data?.kpis;
  const applications = data?.applications || [];
  const totalPages = data?.totalPages || 1;

  // Status color pill helper
  const getStatusBadge = (status: string) => {
    const clean = status.toUpperCase();
    switch (clean) {
      case 'APPLIED':
        return { label: 'Applied', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
      case 'UNDER_REVIEW':
        return { label: 'Under Review', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
      case 'SHORTLISTED':
        return { label: 'Shortlisted', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'ASSESSMENT':
        return { label: 'Assessment', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
      case 'INTERVIEW_SCHEDULED':
      case 'INTERVIEW':
        return { label: 'Interview Scheduled', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
      case 'INTERVIEW_COMPLETED':
        return { label: 'Interview Done', bg: 'bg-teal-500/10 text-teal-400 border-teal-500/20' };
      case 'OFFERED':
        return { label: 'Offer Extended', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'ACCEPTED':
      case 'HIRED':
        return { label: 'Accepted', bg: 'bg-green-600/15 text-green-400 border-green-500/30' };
      case 'REJECTED':
        return { label: 'Not Selected', bg: 'bg-red-500/10 text-red-400 border-red-500/20' };
      case 'WITHDRAWN':
        return { label: 'Withdrawn', bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
      case 'ON_HOLD':
        return { label: 'On Hold', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
      default:
        return { label: status, bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="border-b border-[#1e293b] pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-600/15 text-blue-400 border border-blue-500/30">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Application Lifecycle Tracker
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized tracking of cohort candidate recruitment stages, bottlenecks, and lifecycle histories.
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1e293b] text-slate-300 hover:text-white hover:bg-[#334155] transition-colors border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Pipeline
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-3">
          <div className="text-[11px] font-mono text-slate-400">Total</div>
          <div className="text-xl font-bold text-white mt-1">{kpis?.totalApplications ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Applications</div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-3">
          <div className="text-[11px] font-mono text-blue-400">Active</div>
          <div className="text-xl font-bold text-blue-400 mt-1">{kpis?.activeApplications ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">In Progress</div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-3">
          <div className="text-[11px] font-mono text-amber-400">Shortlisted</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{kpis?.shortlistedCount ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Cleared initial</div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-3">
          <div className="text-[11px] font-mono text-cyan-400">Interviews</div>
          <div className="text-xl font-bold text-cyan-400 mt-1">{kpis?.interviewCount ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Scheduled / Done</div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-3">
          <div className="text-[11px] font-mono text-emerald-400">Offers</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{kpis?.offeredCount ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Extended</div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-3">
          <div className="text-[11px] font-mono text-green-400">Accepted</div>
          <div className="text-xl font-bold text-green-400 mt-1">{kpis?.acceptedCount ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Confirmed placed</div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-3">
          <div className="text-[11px] font-mono text-red-400">Not Selected</div>
          <div className="text-xl font-bold text-red-400 mt-1">{kpis?.rejectedCount ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Rejected</div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-3">
          <div className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            Delays
          </div>
          <div className="text-xl font-bold text-amber-400 mt-1">{kpis?.stageDelayedCount ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">&gt; 14 days in stage</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search student or email..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#1e293b] text-white text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={e => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#1e293b] text-slate-300 text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Stages</option>
              <option value="APPLIED">Applied</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
              <option value="INTERVIEW_COMPLETED">Interview Completed</option>
              <option value="OFFERED">Offer Extended</option>
              <option value="ACCEPTED">Accepted / Placed</option>
              <option value="REJECTED">Not Selected</option>
              <option value="WITHDRAWN">Withdrawn</option>
              <option value="ON_HOLD">On Hold</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDepartment}
              onChange={e => {
                setSelectedDepartment(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#1e293b] text-slate-300 text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Departments</option>
              {data?.departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Filter */}
          <div>
            <select
              value={selectedBatch}
              onChange={e => {
                setSelectedBatch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#1e293b] text-slate-300 text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Batches</option>
              {data?.batches.map(b => (
                <option key={b} value={b.toString()}>
                  Batch of {b}
                </option>
              ))}
            </select>
          </div>

          {/* Company Filter */}
          <div>
            <select
              value={selectedCompany}
              onChange={e => {
                setSelectedCompany(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#1e293b] text-slate-300 text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Companies</option>
              {data?.companies.map(comp => (
                <option key={comp} value={comp}>
                  {comp}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters helper */}
        {(search || selectedStatus !== 'ALL' || selectedDepartment !== 'ALL' || selectedBatch !== 'ALL' || selectedCompany !== 'ALL') && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#1e293b]">
            <span>Active filters applied. Showing matching records.</span>
            <button
              onClick={() => {
                setSearch('');
                setSelectedStatus('ALL');
                setSelectedDepartment('ALL');
                setSelectedBatch('ALL');
                setSelectedCompany('ALL');
                setPage(1);
              }}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Applications Data Table */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
            <p className="text-xs">Loading institutional applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Layers className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-200">No Applications Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              No applications match the current filter criteria or your enrolled student cohort has not submitted applications for these requisitions yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1e293b]/60 text-slate-400 font-mono text-[11px] border-b border-[#1e293b]">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Department / Batch</th>
                  <th className="py-3 px-4">Company & Requisition</th>
                  <th className="py-3 px-4">Current Stage</th>
                  <th className="py-3 px-4">Duration & Bottlenecks</th>
                  <th className="py-3 px-4">Match Score</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {applications.map(app => {
                  const badge = getStatusBadge(app.status);
                  return (
                    <tr key={app.id} className="hover:bg-[#1e293b]/40 transition-colors">
                      {/* Student Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              app.avatarUrl ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(app.studentName)}`
                            }
                            alt={app.studentName}
                            className="w-7 h-7 rounded-full border border-slate-700 object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-100 truncate">{app.studentName}</div>
                            <div className="text-[10px] text-slate-400 truncate">{app.studentEmail}</div>
                          </div>
                        </div>
                      </td>

                      {/* Dept & Batch */}
                      <td className="py-3 px-4">
                        <div className="text-slate-200 font-medium">{app.department}</div>
                        <div className="text-[10px] text-slate-400">
                          {app.gradYear ? `Batch of ${app.gradYear}` : 'Batch N/A'}
                          {app.cgpa ? ` • CGPA: ${app.cgpa.toFixed(1)}` : ''}
                        </div>
                      </td>

                      {/* Company & Requisition */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{app.companyName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[170px] mt-0.5">
                          {app.opportunityTitle}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Applied: {new Date(app.appliedAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Stage Duration & Delay */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-200 font-medium">
                            {app.daysInCurrentStage} {app.daysInCurrentStage === 1 ? 'day' : 'days'}
                          </span>
                        </div>
                        {app.isStageDelayed && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 mt-1 rounded bg-amber-500/10 text-amber-400 text-[10px] border border-amber-500/30">
                            <AlertCircle className="w-3 h-3" />
                            Stage Delay (&gt; {app.delayThresholdDays}d)
                          </span>
                        )}
                      </td>

                      {/* Match Score */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center font-mono font-bold text-xs text-blue-400">
                            {Math.round(app.matchScoreAtApply)}%
                          </div>
                          <span className="text-[10px] uppercase font-mono text-slate-400">
                            {app.matchTier || 'medium'} tier
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedAppId(app.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#1e293b] text-blue-400 hover:text-white hover:bg-blue-600 transition-colors border border-slate-700"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Timeline
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {applications.length > 0 && (
          <div className="p-3 bg-[#1e293b]/40 border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing page <span className="font-semibold text-white">{page}</span> of{' '}
              <span className="font-semibold text-white">{totalPages}</span> ({data?.total || 0} total applications)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-[#1e293b] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg bg-[#1e293b] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Application Detail & Lifecycle Timeline Modal */}
      {selectedAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/15 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Application Lifecycle & Timeline</h3>
                  <p className="text-xs text-slate-400">Verifiable stage progression and duration audit</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAppId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {isDetailLoading ? (
                <div className="p-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                  <p className="text-xs">Loading application lifecycle history...</p>
                </div>
              ) : detailData?.application ? (
                <>
                  {/* Candidate & Opportunity Summary Card */}
                  <div className="bg-[#1e293b]/60 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-slate-400">Candidate</div>
                      <div className="font-semibold text-white text-sm mt-0.5">
                        {detailData.application.studentName}
                      </div>
                      <div className="text-xs text-slate-400">{detailData.application.studentEmail}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {detailData.application.department} • Batch of {detailData.application.gradYear || 'N/A'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-mono uppercase text-slate-400">Requisition</div>
                      <div className="font-semibold text-white text-sm mt-0.5">
                        {detailData.application.opportunityTitle}
                      </div>
                      <div className="text-xs text-blue-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {detailData.application.companyName}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            getStatusBadge(detailData.application.status).bg
                          }`}
                        >
                          {getStatusBadge(detailData.application.status).label}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {detailData.application.daysInCurrentStage}d in stage
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resume Document Link if present */}
                  {detailData.application.resume && (
                    <div className="bg-[#1e293b]/30 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <div>
                          <div className="text-xs font-medium text-slate-200">
                            {detailData.application.resume.title}
                          </div>
                          <div className="text-[10px] text-slate-500">Submitted ATS Candidate Resume</div>
                        </div>
                      </div>
                      <a
                        href={detailData.application.resume.fileUrl || `/api/resumes/${detailData.application.resume.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600/20 text-blue-400 text-xs hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Document
                      </a>
                    </div>
                  )}

                  {/* Cover Note if present */}
                  {detailData.application.coverNote && (
                    <div className="bg-[#1e293b]/30 border border-slate-800 rounded-lg p-3">
                      <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">Cover Note</div>
                      <p className="text-xs text-slate-300 italic">"{detailData.application.coverNote}"</p>
                    </div>
                  )}

                  {/* Lifecycle Event Timeline */}
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      Status Progression Timeline
                    </h4>

                    <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
                      {detailData.application.timeline?.map((event, idx) => {
                        const isLatest = idx === (detailData.application.timeline?.length || 0) - 1;
                        return (
                          <div key={idx} className="relative">
                            {/* Dot indicator */}
                            <div
                              className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 ${
                                isLatest
                                  ? 'bg-blue-500 border-blue-400 shadow-xs shadow-blue-500/50'
                                  : 'bg-[#0f172a] border-slate-600'
                              }`}
                            />

                            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                              <span className="text-xs font-semibold text-white flex items-center gap-2">
                                {event.label}
                                {isLatest && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                    Current Stage
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {new Date(event.timestamp).toLocaleString()}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Actor: <span className="text-slate-300 font-medium">{event.actor}</span> ({event.actorRole})
                              {event.durationInPreviousStageDays !== undefined && event.durationInPreviousStageDays > 0 && (
                                <span className="ml-2 text-slate-500">
                                  • {event.durationInPreviousStageDays}d in previous stage
                                </span>
                              )}
                            </div>

                            {event.notes && (
                              <div className="mt-1.5 p-2 rounded bg-[#1e293b]/70 border border-slate-800 text-xs text-slate-300">
                                {event.notes}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-[#1e293b]/30 flex justify-end">
              <button
                onClick={() => setSelectedAppId(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionApplicationsPage;
