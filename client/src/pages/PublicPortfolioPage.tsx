import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Printer,
  Share2,
  ShieldCheck,
  Award,
  BookOpen,
  Github,
  Linkedin,
  Mail,
  ExternalLink,
  Radar as RadarIcon,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { api } from '../lib/api';
import { SkillRadarCard } from '../components/SkillRadarCard';
import { MatchBadge } from '../components/MatchBadge';

export const PublicPortfolioPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    const fetchPortfolio = async () => {
      try {
        const res = await api.get<{ portfolio: any }>(`/students/${studentId}/portfolio`);
        setPortfolio(res.portfolio);
      } catch (err) {
        console.error('Portfolio fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, [studentId]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-bridge-teal border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-ink-muted">Loading verified digital portfolio...</span>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h2 className="font-serif text-2xl font-bold text-ink">Student Portfolio Not Found</h2>
          <p className="text-xs text-ink-muted">The requested student ID is not registered or has no public profile.</p>
          <Link to="/" className="inline-block px-4 py-2 bg-bridge-teal text-white rounded-xl text-xs font-semibold">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-sans p-4 sm:p-8 selection:bg-bridge-teal selection:text-white">
      <div className="max-w-4xl mx-auto space-y-8 print-page">
        {/* Top Floating Action Bar (Hidden in Print) */}
        <div className="no-print flex items-center justify-between p-4 bg-white border border-line rounded-2xl shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-bridge-teal text-white flex items-center justify-center font-serif font-bold text-sm">
              S
            </div>
            <div>
              <span className="font-serif font-bold text-sm text-ink">
                Skill<span className="text-bridge-teal">Bridge</span>
              </span>
              <span className="text-[10px] font-mono text-ink-muted ml-2">
                Verified Digital Credential
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line hover:border-ink-muted text-xs font-medium text-ink transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-bridge-teal hover:bg-bridge-teal/90 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* Verified Portfolio Header Card */}
        <div className="bg-white border border-line rounded-3xl p-6 sm:p-8 shadow-campus-card space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-line">
            <div className="flex items-center gap-4">
              <img
                src={portfolio.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${portfolio.name}`}
                alt={portfolio.name}
                className="w-20 h-20 rounded-2xl object-cover border border-line shadow-sm"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
                    {portfolio.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-green/10 text-status-green text-[10px] font-mono font-semibold border border-status-green/20">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Candidate
                  </span>
                </div>
                <div className="text-xs font-semibold text-campus-blue">
                  {portfolio.targetDomain} • {portfolio.institution}
                </div>
                <div className="text-[11px] font-mono text-ink-muted">
                  CGPA: {portfolio.cgpa || '8.5'}/10 • Batch of {portfolio.gradYear || '2025'}
                </div>
              </div>
            </div>

            {/* Verified Badge Count Metric */}
            <div className="flex items-center gap-4 bg-paper p-3.5 rounded-2xl border border-line font-mono text-xs">
              <div className="text-center px-2">
                <div className="text-lg font-bold text-bridge-teal">{portfolio.skills.length}</div>
                <div className="text-[10px] text-ink-muted font-sans">Assessed Skills</div>
              </div>
              <div className="w-px h-8 bg-line" />
              <div className="text-center px-2">
                <div className="text-lg font-bold text-industry-amber">{portfolio.completedCourses.length}</div>
                <div className="text-[10px] text-ink-muted font-sans">Partner Certs</div>
              </div>
            </div>
          </div>

          {/* Bio Summary */}
          {portfolio.bio && (
            <p className="text-xs text-ink-muted leading-relaxed max-w-3xl">
              {portfolio.bio}
            </p>
          )}

          {/* Social & Contact Links */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted pt-2">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-campus-blue" />
              {portfolio.email}
            </span>
            {portfolio.githubUsername && (
              <a
                href={`https://github.com/${portfolio.githubUsername}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:text-ink transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                github.com/{portfolio.githubUsername}
              </a>
            )}
            {portfolio.linkedinUrl && (
              <a
                href={portfolio.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:text-[#0A66C2] transition-colors"
              >
                <Linkedin className="w-3.5 h-3.5" />
                LinkedIn Profile
              </a>
            )}
          </div>
        </div>

        {/* Skill Radar Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 bg-white border border-line rounded-3xl p-6 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-ink mb-1">
              Verified Skill Radar
            </h3>
            <span className="text-xs font-mono text-ink-muted block mb-4">
              Competency Vector vs {portfolio.targetDomain} Benchmark
            </span>

            <SkillRadarCard
              studentSkills={portfolio.skills.map((s: any) => ({
                skillId: s.skillId,
                skillName: s.name,
                score: s.score,
              }))}
              benchmarks={portfolio.benchmarks.map((b: any) => ({
                skillId: b.skillId,
                skillName: b.name,
                benchmarkScore: b.benchmarkScore,
              }))}
              targetDomain={portfolio.targetDomain}
              className="border-none p-0 bg-transparent"
            />
          </div>

          {/* Granular Skill Scores List */}
          <div className="md:col-span-5 bg-white border border-line rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-bold text-ink mb-1">
              Competency Scores
            </h3>
            <span className="text-xs font-mono text-ink-muted block">
              Direct assessment & course verification
            </span>

            <div className="space-y-3 pt-2">
              {portfolio.skills.map((s: any) => (
                <div key={s.skillId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-ink">{s.name}</span>
                    <span className="font-mono font-bold text-bridge-teal">{s.score}%</span>
                  </div>
                  <div className="w-full h-2 bg-paper rounded-full overflow-hidden border border-line">
                    <div
                      className="h-full bg-gradient-to-r from-campus-blue to-bridge-teal rounded-full"
                      style={{ width: `${s.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Accredited Partner Courses Completed */}
        {portfolio.completedCourses.length > 0 && (
          <div className="bg-white border border-line rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-bridge-teal" />
              <h3 className="font-serif text-lg font-bold text-ink">
                Verified Learning & Partner Certifications
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {portfolio.completedCourses.map((c: any, i: number) => (
                <div key={i} className="p-4 rounded-2xl bg-paper border border-line space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-mono text-bridge-teal font-semibold">
                      {c.provider}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-green" />
                  </div>
                  <div className="font-semibold text-xs text-ink">{c.title}</div>
                  <div className="text-[10px] font-mono text-ink-muted">
                    Completed on {new Date(c.completedAt || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verification Watermark Footer */}
        <div className="text-center text-xs font-mono text-ink-muted pt-6 border-t border-line">
          <div>Verified Digital Student Portfolio • Powered by SkillBridge Platform Engine</div>
          <div className="text-[10px] text-ink-muted/80 mt-1">Single source of truth calculation • Immutable score vectors</div>
        </div>
      </div>
    </div>
  );
};
