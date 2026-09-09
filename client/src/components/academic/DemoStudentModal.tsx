import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Search,
  Users,
  GraduationCap,
  Sparkles,
  Database,
  BarChart2,
  CheckCircle,
  ArrowRight,
  Filter,
  Layers,
  Award,
  BookOpen,
} from 'lucide-react';
import { api } from '../../lib/api';
import { DemoStudentDto, DemoDatasetStatsDto } from '@shared/types';

interface DemoStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudent: (externalStudentId: string) => void;
  selectedStudentId?: string | null;
  isLoadingAnalysis?: boolean;
}

export const DemoStudentModal: React.FC<DemoStudentModalProps> = ({
  isOpen,
  onClose,
  onSelectStudent,
  selectedStudentId,
  isLoadingAnalysis = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedDomain, setSelectedDomain] = useState('ALL');
  const [chosenStudent, setChosenStudent] = useState<DemoStudentDto | null>(null);

  // Fetch Demo Dataset Statistics
  const { data: statsData } = useQuery({
    queryKey: ['demoDatasetStats'],
    queryFn: () => api.get<{ success: boolean; stats: DemoDatasetStatsDto }>('/academic-performance/demo/stats'),
    enabled: isOpen,
  });

  // Fetch Demo Students
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['demoStudentsList'],
    queryFn: () => api.get<{ success: boolean; students: DemoStudentDto[] }>('/academic-performance/demo/students'),
    enabled: isOpen,
  });

  const stats = statsData?.stats;
  const students = studentsData?.students || [];

  // Extract unique branches and domains for filters
  const branches = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => set.add(s.branch));
    return Array.from(set).sort();
  }, [students]);

  const domains = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => set.add(s.domain));
    return Array.from(set).sort();
  }, [students]);

  // Filter students based on search and dropdowns
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (selectedBranch !== 'ALL' && s.branch !== selectedBranch) return false;
      if (selectedDomain !== 'ALL' && s.domain !== selectedDomain) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesName = s.studentName.toLowerCase().includes(q);
        const matchesId = s.externalStudentId.toLowerCase().includes(q);
        const matchesBranch = s.branch.toLowerCase().includes(q);
        const matchesDomain = s.domain.toLowerCase().includes(q);
        const matchesSkill = s.skills.some(k => k.skill.toLowerCase().includes(q));
        if (!matchesName && !matchesId && !matchesBranch && !matchesDomain && !matchesSkill) {
          return false;
        }
      }
      return true;
    });
  }, [students, selectedBranch, selectedDomain, searchTerm]);

  // Auto-select initial student if none chosen
  React.useEffect(() => {
    if (students.length > 0 && !chosenStudent) {
      const match = selectedStudentId ? students.find(s => s.externalStudentId === selectedStudentId) : null;
      setChosenStudent(match || students[0]);
    }
  }, [students, selectedStudentId, chosenStudent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* ─── 1. MODAL HEADER ────────────────────────────────────────── */}
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Academic Performance Demo & Reference Mode
                </h2>
                <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                  150-Record Dataset
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Select any student profile from the imported benchmark dataset to evaluate radar charts, weak domain detection, and 6-stage roadmaps.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#131f37] hover:bg-[#1e293b] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ─── 2. DYNAMIC DATASET KPI STATS BANNER ──────────────────────── */}
        {stats && (
          <div className="bg-[#080e21] border-b border-[#1e293b] px-6 py-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Records</div>
              <div className="text-sm font-bold text-cyan-400">{stats.totalRecords} Records</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Unique Students</div>
              <div className="text-sm font-bold text-white">{stats.uniqueStudents} Students</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Branches</div>
              <div className="text-sm font-bold text-slate-300">{stats.uniqueBranches} Branches</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Domains</div>
              <div className="text-sm font-bold text-slate-300">{stats.uniqueDomains} Domains</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Unique Skills</div>
              <div className="text-sm font-bold text-slate-300">{stats.uniqueSkills} Skills</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Average Score</div>
              <div className="text-sm font-bold text-emerald-400">{stats.averageScore}%</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Score Range</div>
              <div className="text-sm font-bold text-amber-400">{stats.lowestScore}% – {stats.highestScore}%</div>
            </div>
          </div>
        )}

        {/* ─── 3. SEARCH & FILTERS TOOLBAR ─────────────────────────────── */}
        <div className="p-4 border-b border-[#1e293b] bg-[#0b1329] flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, ID, branch, or skill..."
              className="w-full pl-9 pr-4 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="ALL">All Branches ({branches.length})</option>
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="px-3 py-2 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="ALL">All Domains ({domains.length})</option>
              {domains.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ─── 4. MAIN CONTENT AREA (SPLIT LIST + PREVIEW) ──────────────── */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
          {/* Left Column: Student Cards List */}
          <div className="lg:col-span-5 border-r border-[#1e293b] overflow-y-auto p-4 space-y-2.5 max-h-[50vh] lg:max-h-full">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 mb-1">
              <span>Showing {filteredStudents.length} of {students.length} students</span>
              <span className="text-[11px] text-cyan-400">Click to preview</span>
            </div>

            {studentsLoading ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Loading demo students...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No matching students found.
              </div>
            ) : (
              filteredStudents.map(student => {
                const isSelected = chosenStudent?.externalStudentId === student.externalStudentId;
                return (
                  <div
                    key={student.externalStudentId}
                    onClick={() => setChosenStudent(student)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/50 shadow-lg shadow-cyan-900/20'
                        : 'bg-[#0f172a] border-[#1e293b] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">{student.studentName}</h4>
                          <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                            {student.externalStudentId}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{student.branch}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-400">{student.averageScore}%</div>
                        <div className="text-[9px] text-slate-400">Avg Score</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-2 border-t border-[#1e293b]/70">
                      <span className="text-slate-400">
                        Domain: <strong className="text-slate-300">{student.domain}</strong>
                      </span>
                      <span className="text-rose-400 font-medium">
                        Lowest: {student.lowestSkill?.skill} ({student.lowestSkill?.score}%)
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Selected Student Skill Profile Details */}
          <div className="lg:col-span-7 p-6 overflow-y-auto bg-[#080e21]/40 flex flex-col justify-between">
            {chosenStudent ? (
              <div className="space-y-6">
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 relative overflow-hidden">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{chosenStudent.studentName}</h3>
                        <span className="text-xs text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          {chosenStudent.externalStudentId}
                        </span>
                        <span className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium">
                          Demo Profile
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                        <span>Branch: <strong className="text-slate-200">{chosenStudent.branch}</strong></span>
                        <span>•</span>
                        <span>Domain: <strong className="text-cyan-300">{chosenStudent.domain}</strong></span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold text-cyan-400">{chosenStudent.averageScore}%</div>
                      <div className="text-[10px] text-slate-400">Aggregate Mean</div>
                    </div>
                  </div>
                </div>

                {/* Skills Breakdown Grid */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Imported Skill Records ({chosenStudent.skills.length})</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {chosenStudent.skills.map(k => {
                      const isLow = k.score < 55;
                      const isMid = k.score >= 55 && k.score < 75;
                      return (
                        <div
                          key={k.skill}
                          className={`p-3 rounded-xl border flex items-center justify-between ${
                            isLow
                              ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                              : isMid
                              ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                              : 'bg-[#0f172a] border-[#1e293b] text-slate-200'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold">{k.skill}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{k.skillCategory}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold font-mono">{k.score}%</div>
                            <div className="text-[9px] text-slate-400">
                              {isLow ? 'Priority Gap' : isMid ? 'Needs Boost' : 'Strong'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Information Callout */}
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 text-xs text-cyan-200 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Data-Driven Analysis Engine:</strong> Clicking "Load Demo Analysis" will pass this student's actual normalized skill records into the production domain weighting algorithm, generating a real-time radar chart, weakness diagnosis, and custom roadmap.
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 text-xs">
                Select a demo student from the left panel.
              </div>
            )}
          </div>
        </div>

        {/* ─── 5. MODAL FOOTER ────────────────────────────────────────── */}
        <div className="p-4 sm:p-5 border-t border-[#1e293b] bg-[#0f172a]/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>
              Selected: <strong className="text-white">{chosenStudent?.studentName || 'None'}</strong> ({chosenStudent?.externalStudentId})
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-[#131f37] hover:bg-[#1e293b] rounded-xl border border-[#1e293b] transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                if (chosenStudent) {
                  onSelectStudent(chosenStudent.externalStudentId);
                }
              }}
              disabled={!chosenStudent || isLoadingAnalysis}
              className="flex-1 sm:flex-none px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoadingAnalysis ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading Analysis...</span>
                </>
              ) : (
                <>
                  <span>Load Demo Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
