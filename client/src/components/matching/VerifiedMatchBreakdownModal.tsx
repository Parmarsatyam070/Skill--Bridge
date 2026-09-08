import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Award,
  Code,
  FolderGit2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  BookOpen,
  TrendingUp,
  Flame,
  Terminal,
  Layers,
  Cpu,
} from 'lucide-react';
import { MatchBreakdown } from '@shared/types';
import { MatchBadge } from '../MatchBadge';

interface VerifiedMatchBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  candidateAvatar?: string;
  candidateInstitution?: string;
  candidateCgpa?: number | null;
  jobTitle?: string;
  breakdown: MatchBreakdown | null;
}

export const VerifiedMatchBreakdownModal: React.FC<VerifiedMatchBreakdownModalProps> = ({
  isOpen,
  onClose,
  candidateName,
  candidateAvatar,
  candidateInstitution,
  candidateCgpa,
  jobTitle,
  breakdown,
}) => {
  const [activeTab, setActiveTab] = useState<'skills' | 'experience' | 'assessment'>('skills');

  if (!isOpen || !breakdown) return null;

  const pillars = breakdown.pillars;
  const skillPillar = pillars?.skillMatch;
  const expPillar = pillars?.experienceMatch;
  const assessPillar = pillars?.assessmentScore;

  const tierColors = {
    high: 'text-status-green border-status-green/30 bg-status-green/10',
    medium: 'text-status-amber border-status-amber/30 bg-status-amber/10',
    low: 'text-status-red border-status-red/30 bg-status-red/10',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-console-panel border border-console-border rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header & Verified Match Score Hero */}
        <div className="px-6 py-5 bg-gradient-to-r from-console-panel-raised via-console-panel to-console-bg border-b border-console-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-bridge-teal/15 text-bridge-teal border border-bridge-teal/30 text-[10px] font-mono font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>AUTHORITATIVE 3-PILLAR MATCH CALIBRATION</span>
              </span>
              {breakdown.verificationHash && (
                <span className="text-[10px] font-mono text-console-text-muted hidden sm:inline">
                  HASH: {breakdown.verificationHash}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-console-text-muted hover:text-console-text hover:bg-console-panel transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={candidateAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${candidateName}`}
                alt={candidateName}
                className="w-13 h-13 rounded-2xl object-cover border border-console-border shadow-sm"
              />
              <div>
                <h2 className="font-serif text-xl font-bold text-console-text">
                  {candidateName}
                </h2>
                <div className="text-xs text-console-text-muted font-mono flex flex-wrap items-center gap-2">
                  <span>{candidateInstitution || 'University Candidate'}</span>
                  {candidateCgpa && <span>• CGPA {candidateCgpa}/10</span>}
                  {jobTitle && <span>• Target: {jobTitle}</span>}
                </div>
              </div>
            </div>

            {/* Composite Score Card */}
            <div className="flex items-center gap-4 bg-console-panel-raised border border-console-border px-4 py-2.5 rounded-2xl">
              <div className="text-right font-mono">
                <div className="text-[10px] uppercase text-console-text-muted font-semibold tracking-wider">
                  Verified Match Score
                </div>
                <div className="flex items-center justify-end gap-1.5">
                  <span className="font-serif text-2xl font-bold text-console-text">
                    {breakdown.overallScore}%
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${tierColors[breakdown.tier]}`}>
                    {breakdown.tier} Match
                  </span>
                </div>
              </div>
              <MatchBadge score={breakdown.overallScore} tier={breakdown.tier} size="lg" />
            </div>
          </div>

          {/* 3 Pillars Summary Mini Bar */}
          <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-xs">
            <button
              onClick={() => setActiveTab('skills')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                activeTab === 'skills'
                  ? 'bg-bridge-teal/15 border-bridge-teal text-bridge-teal font-bold shadow-sm'
                  : 'bg-console-panel border-console-border text-console-text-muted hover:text-console-text'
              }`}
            >
              <div className="text-[10px] uppercase opacity-75">Pillar 1 (40%)</div>
              <div className="text-sm font-bold text-console-text flex items-center justify-between">
                <span>Skill Match</span>
                <span className="text-bridge-teal">{skillPillar?.score ?? breakdown.overallScore}%</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('experience')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                activeTab === 'experience'
                  ? 'bg-industry-amber/15 border-industry-amber text-industry-amber font-bold shadow-sm'
                  : 'bg-console-panel border-console-border text-console-text-muted hover:text-console-text'
              }`}
            >
              <div className="text-[10px] uppercase opacity-75">Pillar 2 (30%)</div>
              <div className="text-sm font-bold text-console-text flex items-center justify-between">
                <span>Experience</span>
                <span className="text-industry-amber">{expPillar?.score ?? 0}%</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('assessment')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                activeTab === 'assessment'
                  ? 'bg-status-green/15 border-status-green text-status-green font-bold shadow-sm'
                  : 'bg-console-panel border-console-border text-console-text-muted hover:text-console-text'
              }`}
            >
              <div className="text-[10px] uppercase opacity-75">Pillar 3 (30%)</div>
              <div className="text-sm font-bold text-console-text flex items-center justify-between">
                <span>Assessment</span>
                <span className="text-status-green">{assessPillar?.score ?? 0}%</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content Area (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 max-h-[60vh]">
          {/* TAB 1: SKILL MATCH */}
          {activeTab === 'skills' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-mono text-bridge-teal font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Skill Vector Fulfillment (40% of Final Score)</span>
                  </div>
                  <p className="text-[11px] text-console-text-muted">
                    Evaluates student assessed skill scores against required minimum benchmarks and weights.
                  </p>
                </div>
                {skillPillar?.penalty ? (
                  <span className="px-2 py-1 rounded bg-status-red/10 border border-status-red/25 text-status-red font-mono text-[10px]">
                    -{skillPillar.penalty}% Missing Penalty
                  </span>
                ) : null}
              </div>

              {/* Skills Matrix */}
              <div className="space-y-2">
                {(skillPillar?.matchedSkills || breakdown.matchedSkills || []).map(sk => (
                  <div
                    key={sk.skillId}
                    className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      sk.isMet
                        ? 'bg-status-green/5 border-status-green/25'
                        : 'bg-console-panel-raised border-console-border'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-console-text">{sk.skillName}</span>
                        {sk.isMet ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-status-green/15 text-status-green font-bold">
                            ✓ Target Met
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-status-amber/15 text-status-amber font-semibold">
                            Gap: {Math.max(0, sk.requiredScore - sk.studentScore)}%
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-console-text-muted">
                        Weight: {sk.weight}x • Contribution: {sk.contribution}% of raw vector
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-36 space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-console-text-muted">
                          <span>Student: {sk.studentScore}%</span>
                          <span>Req: {sk.requiredScore}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-console-bg rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              sk.isMet ? 'bg-status-green' : 'bg-status-amber'
                            }`}
                            style={{ width: `${Math.min(100, (sk.studentScore / (sk.requiredScore || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Strengths & Missing Skills */}
              {breakdown.strengths?.length > 0 && (
                <div className="p-4 rounded-xl bg-status-green/10 border border-status-green/20 space-y-1.5">
                  <div className="text-xs font-mono font-bold text-status-green flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Validated Competency Strengths</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {breakdown.strengths.map((st, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-status-green/20 text-status-green text-xs font-mono"
                      >
                        {st}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXPERIENCE & PROJECTS */}
          {activeTab === 'experience' && (
            <div className="space-y-5">
              <div className="space-y-0.5">
                <div className="font-mono text-industry-amber font-semibold flex items-center gap-1.5 text-xs">
                  <FolderGit2 className="w-3.5 h-3.5" />
                  <span>Practical Project Portfolio (30% of Final Score)</span>
                </div>
                <p className="text-[11px] text-console-text-muted">
                  Analyzes production code, tech stack keywords, live demonstrations, and domain certificates.
                </p>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-console-panel-raised border border-console-border space-y-0.5">
                  <div className="text-[10px] text-console-text-muted">Tech Stack Match</div>
                  <div className="text-lg font-bold text-industry-amber">
                    {expPillar?.techStackOverlapPct ?? 0}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-console-panel-raised border border-console-border space-y-0.5">
                  <div className="text-[10px] text-console-text-muted">Total Projects</div>
                  <div className="text-lg font-bold text-console-text">
                    {expPillar?.totalProjects ?? 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-console-panel-raised border border-console-border space-y-0.5">
                  <div className="text-[10px] text-console-text-muted">Relevant Projects</div>
                  <div className="text-lg font-bold text-bridge-teal">
                    {expPillar?.matchedProjectsCount ?? 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-console-panel-raised border border-console-border space-y-0.5">
                  <div className="text-[10px] text-console-text-muted">Domain Certs</div>
                  <div className="text-lg font-bold text-status-green">
                    {expPillar?.verifiedCertificates?.filter(c => c.isRelevant).length ?? 0}
                  </div>
                </div>
              </div>

              {/* Projects List */}
              <div className="space-y-3">
                <div className="text-xs font-mono font-semibold text-console-text">
                  Demonstrated Portfolio Projects:
                </div>
                {(!expPillar?.relevantProjects || expPillar.relevantProjects.length === 0) ? (
                  <div className="p-6 rounded-xl bg-console-panel-raised border border-console-border text-center text-xs text-console-text-muted">
                    No relevant projects detected in candidate profile.
                  </div>
                ) : (
                  expPillar.relevantProjects.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="p-4 rounded-xl bg-console-panel-raised border border-console-border space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="font-serif text-sm font-bold text-console-text">
                          {p.title}
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          {p.hasGithub && (
                            <a
                              href={p.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 rounded bg-console-panel border border-console-border text-bridge-teal hover:underline flex items-center gap-1"
                            >
                              <Code className="w-3 h-3" />
                              <span>Code Repo</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {p.hasLiveDemo && (
                            <a
                              href={p.demoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 rounded bg-status-green/15 border border-status-green/30 text-status-green hover:underline flex items-center gap-1 font-bold"
                            >
                              <span>Live Demo</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      {p.description && (
                        <p className="text-xs text-console-text-muted leading-relaxed">
                          {p.description}
                        </p>
                      )}

                      {/* Tech Stack Pills */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {p.techStack.map((tech, i) => {
                          const isMatch = p.matchingSkills.some(
                            ms => ms.toLowerCase().includes(tech.toLowerCase()) || tech.toLowerCase().includes(ms.toLowerCase())
                          );
                          return (
                            <span
                              key={i}
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-mono ${
                                isMatch
                                  ? 'bg-industry-amber/20 text-industry-amber border border-industry-amber/40 font-bold'
                                  : 'bg-console-panel text-console-text-muted border border-console-border'
                              }`}
                            >
                              {tech}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Verified Certificates */}
              {expPillar?.verifiedCertificates && expPillar.verifiedCertificates.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-console-border">
                  <div className="text-xs font-mono font-semibold text-console-text">
                    Verified Credentials & Certifications:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {expPillar.verifiedCertificates.map((cert, i) => (
                      <div
                        key={cert.id || i}
                        className="p-3 rounded-xl bg-console-panel-raised border border-console-border flex items-center justify-between text-xs font-mono"
                      >
                        <div className="truncate pr-2">
                          <div className="font-semibold text-console-text truncate">{cert.title}</div>
                          <div className="text-[10px] text-console-text-muted">{cert.issuer}</div>
                        </div>
                        {cert.credentialUrl && (
                          <a
                            href={cert.credentialUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-bridge-teal hover:underline shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ASSESSMENT SCORE */}
          {activeTab === 'assessment' && (
            <div className="space-y-5">
              <div className="space-y-0.5">
                <div className="font-mono text-status-green font-semibold flex items-center gap-1.5 text-xs">
                  <Award className="w-3.5 h-3.5" />
                  <span>Proctored Assessment & Calibration (30% of Final Score)</span>
                </div>
                <p className="text-[11px] text-console-text-muted">
                  Standardized test accuracy, live coding submissions, and daily practice streak records.
                </p>
              </div>

              {/* Assessment Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-console-panel-raised border border-console-border space-y-0.5">
                  <div className="text-[10px] text-console-text-muted">Average Quiz Score</div>
                  <div className="text-lg font-bold text-status-green">
                    {assessPillar?.averageTestScore ?? 0}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-console-panel-raised border border-console-border space-y-0.5">
                  <div className="text-[10px] text-console-text-muted">Tests Passed</div>
                  <div className="text-lg font-bold text-console-text">
                    {assessPillar?.passedCount ?? 0} / {assessPillar?.attemptsCount ?? 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-console-panel-raised border border-console-border space-y-0.5">
                  <div className="text-[10px] text-console-text-muted">DSA Solved</div>
                  <div className="text-lg font-bold text-bridge-teal">
                    {assessPillar?.dsaSolvedCount ?? 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-console-panel-raised border border-console-border space-y-0.5">
                  <div className="text-[10px] text-console-text-muted">Active Streak</div>
                  <div className="text-lg font-bold text-status-amber flex items-center gap-1">
                    <Flame className="w-4 h-4" />
                    <span>{assessPillar?.dailyPracticeStreak ?? 0}d</span>
                  </div>
                </div>
              </div>

              {/* Calibration Card */}
              <div className="p-4 rounded-xl bg-console-panel-raised border border-console-border flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-console-text">
                    Calibration Tier: <span className="text-status-green">{assessPillar?.calibrationTier || 'Standard'}</span>
                  </div>
                  <p className="text-xs text-console-text-muted">
                    Candidate evaluation validated against standardized academic and DSA benchmarks.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-status-green/15 text-status-green border border-status-green/30 text-xs font-mono font-bold">
                  {assessPillar?.badge || 'Verified Candidate'}
                </span>
              </div>

              {/* DSA Breakdown */}
              {assessPillar?.dsaBreakdown && (
                <div className="space-y-2">
                  <div className="text-xs font-mono font-semibold text-console-text">
                    Coding Challenge Difficulty Breakdown:
                  </div>
                  <div className="grid grid-cols-3 gap-3 font-mono text-xs text-center">
                    <div className="p-3 rounded-xl bg-status-green/10 border border-status-green/25 text-status-green">
                      <div className="font-bold text-lg">{assessPillar.dsaBreakdown.easy}</div>
                      <div className="text-[10px]">Easy Solved</div>
                    </div>
                    <div className="p-3 rounded-xl bg-status-amber/10 border border-status-amber/25 text-status-amber">
                      <div className="font-bold text-lg">{assessPillar.dsaBreakdown.medium}</div>
                      <div className="text-[10px]">Medium Solved</div>
                    </div>
                    <div className="p-3 rounded-xl bg-status-red/10 border border-status-red/25 text-status-red">
                      <div className="font-bold text-lg">{assessPillar.dsaBreakdown.hard}</div>
                      <div className="text-[10px]">Hard Solved</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-console-panel-raised border-t border-console-border flex items-center justify-between text-xs font-mono">
          <div className="text-console-text-muted">
            Pillar Weighting: 40% Skills • 30% Projects • 30% Assessment
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-console-panel hover:bg-console-border text-console-text font-semibold transition-colors"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
