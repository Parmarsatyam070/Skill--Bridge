import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  Upload,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Award,
  Layers,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Target,
  RefreshCw,
  ShieldCheck,
  Zap,
  Flame,
  Lightbulb,
  Database,
  ArrowLeftRight,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { AcademicRadarWidget } from '../../components/academic/AcademicRadarWidget';
import { AcademicRoadmapWidget } from '../../components/academic/AcademicRoadmapWidget';
import { AcademicPracticeRunner } from '../../components/academic/AcademicPracticeRunner';
import { MarksheetUploadModal } from '../../components/academic/MarksheetUploadModal';
import { DemoStudentModal } from '../../components/academic/DemoStudentModal';
import {
  AcademicAnalysisDto,
  UploadedMarksheetDto,
  WeakSubjectDto,
  BookRecommendationDto,
  CourseRecommendationDto,
} from '@shared/types';

export const AcademicPerformancePage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);
  const [demoStudentId, setDemoStudentId] = useState<string | null>(null);
  const [editingMarksheet, setEditingMarksheet] = useState<UploadedMarksheetDto | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'RADAR' | 'ROADMAP' | 'PRACTICE' | 'RESOURCES'>('OVERVIEW');
  const [expandedMarksheetId, setExpandedMarksheetId] = useState<string | null>(null);

  const [analysisSuccessMessage, setAnalysisSuccessMessage] = useState<string | null>(null);

  // Fetch Full Academic Analysis (Real Mode)
  const { data: realAnalysisData, isLoading: realAnalysisLoading, refetch: refetchAnalysis } = useQuery({
    queryKey: ['academicAnalysis'],
    queryFn: () => api.get<{ analysis: AcademicAnalysisDto }>('/academic-performance/analysis'),
    enabled: !demoStudentId,
  });

  // Fetch Demo Student Analysis (Demo Mode)
  const { data: demoAnalysisData, isLoading: demoAnalysisLoading } = useQuery({
    queryKey: ['demoStudentAnalysis', demoStudentId],
    queryFn: () => api.get<{ success: boolean; analysis: AcademicAnalysisDto }>(`/academic-performance/demo/students/${demoStudentId}/analysis`),
    enabled: Boolean(demoStudentId),
  });

  // Fetch Uploaded Marksheets
  const { data: marksheetsData, isLoading: marksheetsLoading } = useQuery({
    queryKey: ['uploadedMarksheets'],
    queryFn: () => api.get<{ marksheets: UploadedMarksheetDto[] }>('/academic-performance/marksheets'),
  });

  // Step 7: Explicit academic analysis mutation
  const analyzeMutation = useMutation({
    mutationFn: () => api.post<{ analysis: AcademicAnalysisDto; message?: string }>('/academic-performance/analyze', {}),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['academicAnalysis'] });
      setAnalysisSuccessMessage(data.message || 'Academic analysis completed.');
      setTimeout(() => setAnalysisSuccessMessage(null), 4000);
    },
  });

  const isDemoMode = Boolean(demoStudentId);
  const analysis = isDemoMode ? demoAnalysisData?.analysis : realAnalysisData?.analysis;
  const marksheets = isDemoMode ? [] : (marksheetsData?.marksheets || []);

  const handleOpenUpload = () => {
    setEditingMarksheet(null);
    setIsUploadModalOpen(true);
  };

  const handleEditMarksheet = (m: UploadedMarksheetDto) => {
    setEditingMarksheet(m);
    setIsUploadModalOpen(true);
  };

  const handleSelectDemoStudent = (externalStudentId: string) => {
    setDemoStudentId(externalStudentId);
    setIsDemoModalOpen(false);
    setAnalysisSuccessMessage(`Loaded demo benchmark profile for student ${externalStudentId}.`);
    setTimeout(() => setAnalysisSuccessMessage(null), 4000);
  };

  const handleExitDemoMode = () => {
    setDemoStudentId(null);
    setAnalysisSuccessMessage('Switched back to your verified academic marksheet records.');
    setTimeout(() => setAnalysisSuccessMessage(null), 4000);
  };

  const studentContext = {
    domain: isDemoMode ? (analysis?.demoDomain || 'Technical') : (user?.studentProfile?.targetDomain || 'Full-Stack Web'),
    degree: isDemoMode ? 'B.Tech' : ((user?.studentProfile as any)?.degree || 'B.Tech'),
    institution: isDemoMode ? 'SkillBridge Benchmark University' : (user?.studentProfile?.institution || 'SkillBridge University'),
    branch: isDemoMode ? (analysis?.demoBranch || 'Computer Science') : ((user?.studentProfile as any)?.branch || 'Computer Science and Engineering'),
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white p-4 sm:p-6 lg:p-8">
      {/* ─── 1. TOP HERO HEADER ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* DEMO MODE NOTICE BANNER */}
        {isDemoMode && (
          <div className="bg-gradient-to-r from-cyan-950/80 via-[#0b1b36] to-blue-950/80 border border-cyan-500/40 text-cyan-200 px-5 py-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                    DEMO DATASET ACTIVE
                  </span>
                  <span className="text-xs font-semibold text-cyan-300">
                    {analysis?.demoStudentName} ({analysis?.externalStudentId})
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Showing imported skill performance data ({analysis?.demoBranch} • {analysis?.demoDomain}). Source: <strong className="text-cyan-400">DEMO_DATASET</strong>. Not a verified marksheet.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="px-3 py-1.5 bg-[#0f172a] hover:bg-[#131f37] text-cyan-300 text-xs font-medium rounded-xl border border-cyan-500/30 transition-colors"
              >
                Change Demo Student
              </button>
              <button
                onClick={handleExitDemoMode}
                className="px-3.5 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-white text-xs font-semibold rounded-xl border border-blue-500/40 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Switch to My Marksheets</span>
              </button>
            </div>
          </div>
        )}

        {analysisSuccessMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{analysisSuccessMessage}</span>
          </div>
        )}


        <div className="bg-[#0b1329] border border-[#1e293b] rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          {/* Ambient Lighting */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Academic Performance & Improvement
                </h1>
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Domain-Aware Analytics
                </span>
              </div>

              <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                Semester-wise marksheet intelligence, multi-term trajectory analysis, domain relevance weighting, and tailored learning roadmaps.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-300">
                <span className="bg-[#0f172a] border border-[#1e293b] px-3 py-1 rounded-lg">
                  Target Domain: <strong className="text-cyan-400">{studentContext.domain}</strong>
                </span>
                <span className="bg-[#0f172a] border border-[#1e293b] px-3 py-1 rounded-lg">
                  Degree: <strong className="text-white">{studentContext.degree}</strong>
                </span>
                <span className="bg-[#0f172a] border border-[#1e293b] px-3 py-1 rounded-lg">
                  Institution: <strong className="text-slate-300">{studentContext.institution}</strong>
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="px-4 py-2.5 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 hover:text-white text-xs font-semibold rounded-xl border border-cyan-500/40 flex items-center gap-2 transition-all shadow-md shadow-cyan-950/40"
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Try with Demo Data</span>
              </button>

              <button
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzeMutation.isPending || marksheets.length === 0 || isDemoMode}
                className="px-4 py-2.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 hover:text-white text-xs font-medium rounded-xl border border-cyan-500/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    <span>Analyzing your academic performance...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Analyze Performance</span>
                  </>
                )}
              </button>

              <button
                onClick={handleOpenUpload}
                disabled={isDemoMode}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Marksheet</span>
              </button>
            </div>

          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 border-t border-[#1e293b] mt-8 pt-4 overflow-x-auto pb-1 relative z-10">
            {[
              { key: 'OVERVIEW', label: 'Academic Overview & Skill Gaps', icon: BarChart3 },
              { key: 'RADAR', label: 'Performance Radar Chart', icon: Target },
              { key: 'ROADMAP', label: 'Personalized Improvement Roadmap', icon: Layers },
              { key: 'PRACTICE', label: 'Topic-Wise Practice Sets', icon: Zap },
              { key: 'RESOURCES', label: 'Curated Books & Courses', icon: BookOpen },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#0f172a]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── 2. ACADEMIC OVERVIEW KPI CARDS ──────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Semesters Analyzed</span>
              <Layers className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {analysis?.semestersAnalyzed || marksheets.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Total Subjects: <strong className="text-slate-300">{analysis?.totalSubjects || 0}</strong>
            </div>
          </div>

          <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Core Domain Average</span>
              <Target className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-cyan-400">
              {analysis?.coreDomainPercentage ? `${analysis.coreDomainPercentage}%` : '—'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Overall Academic Avg: <strong className="text-slate-300">{analysis?.overallPercentage || 0}%</strong>
            </div>
          </div>

          <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Identified Domain Gaps</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {analysis?.weakSubjects?.length || 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Domain-Relevance Filter Active
            </div>
          </div>

          <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Academic Status</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-white truncate">
              {analysis?.academicStatus || 'No Marksheets'}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              {!analysis?.hasCriticalWeakness && marksheets.length > 0
                ? 'Strong Domain Foundation'
                : 'Remediation Roadmaps Ready'}
            </div>
          </div>
        </div>

        {/* ─── TAB CONTENT SWITCHER ────────────────────────────────────── */}

        {/* TAB 1: OVERVIEW & SKILL GAPS */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-8">
            {/* ALL STRONG CONDITION OR PRIORITIZED WEAK SUBJECTS */}
            {!analysis?.hasCriticalWeakness && marksheets.length > 0 ? (
              /* All Core Domain Subjects Performing Strongly */
              <div className="bg-[#0b1329] border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white">
                      No critical domain-specific academic weakness detected.
                    </h3>
                    <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                      All core domain curriculum subjects are performing at or above the 75% benchmark standard. Below are recommended advanced specialization tracks, competitive programming challenges, and career mastery pathways.
                    </p>

                    {analysis?.advancedMasteryTracks && analysis.advancedMasteryTracks.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#1e293b]">
                        {analysis.advancedMasteryTracks.map((track, tIdx) => (
                          <div key={tIdx} className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Sparkles className="w-4 h-4 text-cyan-400" />
                              <h4 className="text-xs font-semibold text-white">{track.trackName}</h4>
                            </div>
                            <p className="text-[11px] text-slate-400 mb-3">{track.description}</p>
                            <div className="space-y-1">
                              <div className="text-[10px] font-semibold text-slate-300">Recommended Challenges:</div>
                              <div className="flex flex-wrap gap-1">
                                {track.challenges.map(c => (
                                  <span key={c} className="bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[9px] px-2 py-0.5 rounded">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Domain-Prioritized Weak Subjects Section */
              <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 relative overflow-hidden shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white tracking-wide">
                        Domain Skill Gaps & Prioritized Remediation
                      </h3>
                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-medium px-2.5 py-0.5 rounded-full">
                        Domain-Weighted
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Evaluated using formula: <code className="bg-[#0f172a] px-1.5 py-0.5 rounded text-cyan-300 font-mono text-[10px]">Priority Score = (100 - Score%) × Domain Multiplier + Trend Penalty</code>.
                    </p>
                  </div>
                </div>

                {(!analysis?.weakSubjects || analysis.weakSubjects.length === 0) ? (
                  <div className="text-center py-10 text-slate-400 text-xs bg-[#0f172a] rounded-xl border border-[#1e293b]">
                    Upload previous semester marksheets to detect domain skill gaps and generate personalized learning roadmaps.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analysis.weakSubjects.map((ws, idx) => (
                      <div
                        key={ws.normalizedSubject}
                        className="bg-[#0f172a] border border-[#1e293b] hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                              Priority Score: {ws.priorityScore}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-white mb-1">{ws.subjectName}</h4>

                          <div className="flex items-center gap-2 text-xs mb-3">
                            <span className="text-cyan-400 font-bold text-base">{ws.performancePercentage}%</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-blue-400 font-medium text-[11px] bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                              {ws.classification} Domain
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                            {ws.reasonForSelection}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            ws.trend === 'IMPROVING'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : ws.trend === 'DECLINING'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-slate-500/10 text-slate-300'
                          }`}>
                            Trend: {ws.trend}
                          </span>

                          <button
                            onClick={() => setActiveTab('ROADMAP')}
                            className="text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          >
                            <span>View Roadmap</span> &rarr;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Unrelated Subjects Ignored Note (Transparent rule enforcement) */}
                {analysis?.unrelatedSubjectsIgnored && analysis.unrelatedSubjectsIgnored.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-[#1e293b]/70 bg-[#0f172a]/50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-2">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span>Unrelated Subjects Excluded from Domain Gap Prioritization:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.unrelatedSubjectsIgnored.map((u, uIdx) => (
                        <span key={uIdx} className="text-[11px] text-slate-400 bg-[#131f37] border border-[#1e293b] px-2.5 py-1 rounded-lg">
                          <strong>{u.subjectName}</strong> ({u.percentage}%) — <span className="text-slate-500">{u.reason}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* RADAR WIDGET PREVIEW */}
            {analysis?.radarData && analysis.radarData.length > 0 && (
              <AcademicRadarWidget data={analysis.radarData} overallScore={analysis.coreDomainPercentage} />
            )}

            {/* UPLOADED MARKSHEETS LIST */}
            <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-white">Uploaded Marksheets</h3>
                  <p className="text-xs text-slate-400">Previous semester transcripts and verified subject records.</p>
                </div>
                <button
                  onClick={handleOpenUpload}
                  className="px-3.5 py-1.5 bg-[#0f172a] hover:bg-[#131f37] text-cyan-400 text-xs font-medium rounded-xl border border-[#1e293b] flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Another Semester</span>
                </button>
              </div>

              {marksheets.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs bg-[#0f172a] rounded-xl border border-[#1e293b]">
                  No marksheets uploaded yet. Click "Upload Marksheet" above to add your semester records.
                </div>
              ) : (
                <div className="space-y-3">
                  {marksheets.map((m) => {
                    const isExpanded = expandedMarksheetId === m.id;
                    return (
                      <div key={m.id} className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden">
                        <div
                          onClick={() => setExpandedMarksheetId(isExpanded ? null : m.id)}
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#131f37]/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                              S{m.semester}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-white flex items-center gap-2">
                                <span>Semester {m.semester} ({m.academicYear})</span>
                                <span className={`text-[10px] px-2 py-0.2 rounded-full ${
                                  m.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                }`}>
                                  {m.status}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                                <span>File: {m.fileName}</span>
                                {m.sgpa && <span>SGPA: <strong className="text-cyan-400">{m.sgpa}</strong></span>}
                                {m.totalCredits && <span>Credits: {m.totalCredits}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditMarksheet(m);
                              }}
                              className="px-2.5 py-1 text-[11px] text-slate-300 hover:text-white bg-[#131f37] hover:bg-[#1e293b] border border-[#1e293b] rounded-lg transition-colors"
                            >
                              Edit Subjects
                            </button>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                        </div>

                        {/* Expanded Subjects Table */}
                        {isExpanded && (
                          <div className="p-4 pt-0 border-t border-[#1e293b]/60">
                            <div className="overflow-x-auto mt-3">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="text-slate-400 font-medium border-b border-[#1e293b]">
                                    <th className="py-2">Subject</th>
                                    <th className="py-2">Marks (%)</th>
                                    <th className="py-2">Grade</th>
                                    <th className="py-2">Credits</th>
                                    <th className="py-2">Domain Role</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1e293b]/40 text-slate-300">
                                  {m.subjects.map(s => (
                                    <tr key={s.id || s.subjectName} className="hover:bg-[#131f37]/30">
                                      <td className="py-2 font-medium text-white">{s.subjectName}</td>
                                      <td className="py-2 text-cyan-400 font-bold">{s.percentage}%</td>
                                      <td className="py-2">{s.grade || '—'}</td>
                                      <td className="py-2">{s.credits || 3}</td>
                                      <td className="py-2">
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#131f37] border border-[#1e293b] text-blue-300">
                                          {s.classification}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: RADAR CHART */}
        {activeTab === 'RADAR' && (
          <div className="space-y-6">
            {analysis?.radarData && (
              <AcademicRadarWidget data={analysis.radarData} overallScore={analysis.coreDomainPercentage} />
            )}

            {/* Cross-Semester Trajectories breakdown */}
            {analysis?.trends && analysis.trends.length > 0 && (
              <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 shadow-xl">
                <h3 className="text-base font-semibold text-white mb-2">Cross-Semester Performance Trends</h3>
                <p className="text-xs text-slate-400 mb-4">Historical trajectory of individual domain subjects across terms.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysis.trends.map(t => (
                    <div key={t.normalizedSubject} className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="text-xs font-semibold text-white truncate">{t.subjectName}</h4>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          t.trend === 'IMPROVING'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : t.trend === 'DECLINING'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-slate-500/10 text-slate-300'
                        }`}>
                          {t.trend}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-3">{t.summary}</p>
                      <div className="flex items-center gap-2">
                        {t.semesterScores.map((s, idx) => (
                          <div key={idx} className="bg-[#131f37] border border-[#1e293b] rounded px-2 py-1 text-center text-[10px]">
                            <div className="text-slate-400">Sem {s.semester}</div>
                            <div className="font-bold text-cyan-400">{s.percentage}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PERSONALIZED ROADMAP */}
        {activeTab === 'ROADMAP' && (
          <AcademicRoadmapWidget roadmaps={analysis?.roadmaps || []} />
        )}

        {/* TAB 4: PRACTICE SETS */}
        {activeTab === 'PRACTICE' && (
          <AcademicPracticeRunner
            initialSubject={analysis?.weakSubjects?.[0]?.normalizedSubject || 'Data Structures'}
            availableSubjects={analysis?.weakSubjects?.map(w => w.normalizedSubject) || ['Data Structures', 'Database Management Systems', 'Operating Systems', 'Computer Networks']}
          />
        )}

        {/* TAB 5: BOOKS & COURSES */}
        {activeTab === 'RESOURCES' && (
          <div className="space-y-8">
            {/* Book Recommendations */}
            <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-semibold text-white">Curated Academic Textbooks & References</h3>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                Standard academic references and textbooks matched to your identified subject weaknesses.
              </p>

              {(!analysis?.bookRecommendations || analysis.bookRecommendations.length === 0) ? (
                <div className="text-center py-8 text-slate-400 text-xs bg-[#0f172a] rounded-xl border border-[#1e293b]">
                  No textbook recommendations currently queued.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysis.bookRecommendations.map((book, bIdx) => (
                    <div key={bIdx} className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                            {book.difficulty}
                          </span>
                          <span className="text-[10px] text-slate-500">{book.subject}</span>
                        </div>

                        <h4 className="text-xs font-bold text-white mb-1">{book.title}</h4>
                        <div className="text-[11px] text-slate-400 mb-2">Author(s): {book.author}</div>
                        <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">{book.whyRecommended}</p>
                      </div>

                      {book.topicsCovered && (
                        <div className="flex flex-wrap gap-1 pt-3 border-t border-[#1e293b]">
                          {book.topicsCovered.map(t => (
                            <span key={t} className="bg-[#131f37] text-slate-300 text-[9px] px-1.5 py-0.5 rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Course Recommendations */}
            <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-semibold text-white">Verified University & Partner Courses</h3>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                Accredited NPTEL, MIT OCW, Coursera, and freeCodeCamp courses for structured curriculum learning.
              </p>

              {(!analysis?.courseRecommendations || analysis.courseRecommendations.length === 0) ? (
                <div className="text-center py-8 text-slate-400 text-xs bg-[#0f172a] rounded-xl border border-[#1e293b]">
                  No course recommendations currently queued.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysis.courseRecommendations.map((course, cIdx) => (
                    <div key={cIdx} className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                            {course.provider}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold">★ {course.rating}</span>
                        </div>

                        <h4 className="text-xs font-bold text-white mb-1">{course.courseName}</h4>
                        <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">{course.whyRecommended}</p>
                      </div>

                      <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">{course.duration || 'Self-Paced'}</span>
                        <a
                          href={course.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
                        >
                          <span>Explore Course</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Marksheet Upload & Verification Modal */}
      <MarksheetUploadModal
        isOpen={isUploadModalOpen}
        initialMarksheet={editingMarksheet}
        onClose={() => {
          setIsUploadModalOpen(false);
          setEditingMarksheet(null);
        }}
        onSuccess={() => {
          refetchAnalysis();
        }}
      />

      {/* Demo Student Selection Modal */}
      <DemoStudentModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onSelectStudent={handleSelectDemoStudent}
        selectedStudentId={demoStudentId}
        isLoadingAnalysis={demoAnalysisLoading}
      />
    </div>
  );
};

