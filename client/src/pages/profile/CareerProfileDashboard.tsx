import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Edit3,
  Download,
  Eye,
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  Github,
  Linkedin,
  Twitter,
  Globe,
  Mail,
  Award,
  BookOpen,
  Briefcase,
  GraduationCap,
  Sparkles,
  Trophy,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Building,
  Calendar,
  Share2,
  Flame,
  ArrowRight,
  Code,
  ShieldCheck,
  Upload,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { ContributionHeatmap } from '../../components/profile/ContributionHeatmap';
import { ProfileEditModal, ModalType } from '../../components/profile/ProfileEditModal';
import { AvatarUploadModal } from '../../components/profile/AvatarUploadModal';

export const CareerProfileDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [resumeNameInput, setResumeNameInput] = useState('');
  const [shareCopied, setShareCopied] = useState(false);

  const [profile, setProfile] = useState<any>({
    name: user?.name || '',
    username: user?.email ? user.email.split('@')[0] : 'user',
    headline: user?.studentProfile?.targetDomain
      ? `Aspiring ${user.studentProfile.targetDomain} Specialist`
      : 'Aspiring Full-Stack Web Specialist',
    institution: user?.studentProfile?.institution || 'Academic Institution',
    location: 'India',
    avatarUrl: user?.avatarUrl || null,
    resumeFileName: null,
    resumeFileSize: null,
    resumeLastUpdated: null,
    bio: null,
    technicalSkills: [],
    softSkills: [],
    experiences: [],
    educations: [],
    projects: [],
    certificates: [],
    responsibilities: [],
    achievements: [],
    socials: {},
    rankings: {
      totalPoints: 0,
      totalBadges: 0,
      level: 1,
      progressToNextLevel: 0,
      currentStreak: user?.currentStreak || 1,
      longestStreak: user?.longestStreak || 1,
    },
  });

  // Load real student profile from database
  const loadProfileData = async () => {
    if (!user) return;
    const studentProfileId = user.studentProfile?.id;
    if (!studentProfileId) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get<any>(`/students/${studentProfileId}`);
      const s = res.student;

      const fullName = (s?.name && s.name.trim().length > 0)
        ? s.name.trim()
        : (user?.name?.trim() || 'Student');

      setProfile({
        name: fullName,
        username: s?.email ? s.email.split('@')[0] : (user?.email ? user.email.split('@')[0] : 'student'),
        headline: s?.headline || (s?.targetDomain ? `Aspiring ${s.targetDomain} Specialist` : 'Aspiring Full-Stack Web Specialist'),
        institution: s?.institution || user?.studentProfile?.institution || 'Academic Institution',
        location: s?.location || 'India',
        avatarUrl: s?.avatarUrl || user?.avatarUrl || null,
        resumeFileName: s?.resumeFileName || (s?.resumes && s.resumes.length > 0 ? s.resumes[0].title : null),
        resumeFileSize: '210 KB',
        resumeLastUpdated: 'Recently updated',
        bio: s?.bio || null,
        technicalSkills: s?.technicalSkills || [],
        softSkills: s?.softSkills || [],
        experiences: s?.experiences || [],
        educations: s?.educations || [],
        projects: s?.projects || [],
        certificates: s?.certificates || [],
        responsibilities: s?.responsibilities || [],
        achievements: s?.achievements || [],
        socials: s?.socials || {},
        rankings: s?.rankings || {
          totalPoints: 0,
          totalBadges: 0,
          level: 1,
          progressToNextLevel: 0,
          currentStreak: user?.currentStreak || 1,
          longestStreak: user?.longestStreak || 1,
        },
      });
    } catch (err) {
      console.error('Failed to load profile from server:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [user]);

  // Read More / Read Less toggle
  const [bioExpanded, setBioExpanded] = useState(false);

  // Resume Widget Form State
  const [resumeInterest, setResumeInterest] = useState('Full-Stack Software Engineering');
  const [resumeLocation, setResumeLocation] = useState('Bengaluru, Karnataka (or Remote)');

  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: ModalType | null;
    initialData?: any;
  }>({
    isOpen: false,
    type: null,
    initialData: null,
  });

  const openModal = (type: ModalType, initialData?: any) => {
    setModalState({ isOpen: true, type, initialData });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, initialData: null });
  };

  // Immediate database persistence
  const handleSaveModalData = async (type: ModalType, data: any) => {
    let updated = { ...profile };

    switch (type) {
      case 'edit_profile':
        updated = {
          ...updated,
          name: data.name || updated.name,
          headline: data.headline !== undefined ? data.headline : updated.headline,
          institution: data.institution !== undefined ? data.institution : updated.institution,
          location: data.location !== undefined ? data.location : updated.location,
          resumeFileName: data.resumeFileName !== undefined ? data.resumeFileName : updated.resumeFileName,
        };
        break;

      case 'edit_about':
        updated = {
          ...updated,
          bio: data.bio || null,
        };
        break;

      case 'manage_skills':
        updated = {
          ...updated,
          technicalSkills: data.skills || [],
        };
        break;

      case 'add_experience':
        updated = {
          ...updated,
          experiences: [
            {
              id: `exp-${Date.now()}`,
              title: data.title,
              company: data.company,
              duration: data.duration,
              location: data.location || 'India',
              description: data.description,
              skills: data.skills || [],
            },
            ...(updated.experiences || []),
          ],
        };
        break;

      case 'edit_experience':
        updated = {
          ...updated,
          experiences: (updated.experiences || []).map((exp: any) =>
            exp.id === data.id ? { ...exp, ...data } : exp
          ),
        };
        break;

      case 'add_education':
        updated = {
          ...updated,
          educations: [
            {
              id: `edu-${Date.now()}`,
              degree: data.degree,
              institution: data.institution,
              duration: data.duration,
              score: data.score,
              skills: data.skills || [],
            },
            ...(updated.educations || []),
          ],
        };
        break;

      case 'edit_education':
        updated = {
          ...updated,
          educations: (updated.educations || []).map((edu: any) =>
            edu.id === data.id ? { ...edu, ...data } : edu
          ),
        };
        break;

      case 'add_project':
        updated = {
          ...updated,
          projects: [
            {
              id: `proj-${Date.now()}`,
              title: data.title,
              description: data.description,
              techStack: data.techStack || [],
              demoUrl: data.demoUrl,
              githubUrl: data.githubUrl,
            },
            ...(updated.projects || []),
          ],
        };
        break;

      case 'edit_project':
        updated = {
          ...updated,
          projects: (updated.projects || []).map((proj: any) =>
            proj.id === data.id ? { ...proj, ...data } : proj
          ),
        };
        break;

      case 'add_certificate':
        updated = {
          ...updated,
          certificates: [
            {
              id: `cert-${Date.now()}`,
              title: data.title,
              issuer: data.issuer,
              date: data.date,
              url: data.url,
            },
            ...(updated.certificates || []),
          ],
        };
        break;

      case 'add_responsibility':
        updated = {
          ...updated,
          responsibilities: [
            {
              id: `resp-${Date.now()}`,
              title: data.title,
              org: data.org,
              duration: data.duration || '2025 - 2026',
              description: data.description,
            },
            ...(updated.responsibilities || []),
          ],
        };
        break;

      case 'add_achievement':
        updated = {
          ...updated,
          achievements: [
            {
              id: `ach-${Date.now()}`,
              title: data.title,
              org: data.org,
              date: data.date || '2026',
              description: data.description,
            },
            ...(updated.achievements || []),
          ],
        };
        break;

      case 'edit_socials':
        updated = {
          ...updated,
          socials: { ...(updated.socials || {}), ...data },
        };
        break;

      default:
        break;
    }

    setProfile(updated);

    // Save directly to backend
    if (user?.studentProfile?.id) {
      try {
        const res = await api.put<any>(`/students/${user.studentProfile.id}/profile`, updated);
        if (res.rankings) {
          setProfile((p: any) => ({ ...p, rankings: res.rankings }));
        }
        await refreshUser();
      } catch (err) {
        console.error('Failed to persist profile to database:', err);
      }
    }
  };

  const handleStartResumeCreation = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/resume-builder', {
      state: {
        interest: resumeInterest,
        location: resumeLocation,
      },
    });
  };

  const handleShareProfile = () => {
    const url = `${window.location.origin}/p/${profile.username}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  // Compute profile strength dynamically based on filled sections
  const calculateProfileStrength = () => {
    let score = 20; // base signup
    if (profile.bio) score += 15;
    if (profile.resumeFileName) score += 15;
    if (profile.technicalSkills && profile.technicalSkills.length > 0) score += 15;
    if (profile.experiences && profile.experiences.length > 0) score += 15;
    if (profile.educations && profile.educations.length > 0) score += 10;
    if (profile.projects && profile.projects.length > 0) score += 10;
    return Math.min(100, score);
  };

  const profileStrength = calculateProfileStrength();

  // Helper for initials
  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'SB';
    const parts = nameStr.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-4 sm:space-y-5 font-sans">
      {/* ─────────────────────────────────────────────────────────────
          1. PROFILE HERO HEADER (DESIGN SYSTEM V2 VERIFIED IDENTITY)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-bridge-panel border border-bridge-border rounded-xl p-5 sm:p-6 relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: Avatar + Details */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4.5 min-w-0 flex-1">
            {/* Avatar container with photo upload overlay */}
            <div className="relative group shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl object-cover ring-1 ring-white/10 bg-[#161920]"
                />
              ) : (
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl bg-[#2F8C82]/10 ring-1 ring-[#2F8C82]/30 text-[#2F8C82] font-mono font-bold text-2xl flex items-center justify-center">
                  {getInitials(profile.name)}
                </div>
              )}

              {/* Upload photo prompt */}
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute inset-0 rounded-xl bg-black/75 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-[11px] font-semibold cursor-pointer"
                title="Upload or change photo"
              >
                <Upload className="w-4 h-4 mb-0.5 text-[#2F8C82]" />
                <span>Upload</span>
              </button>

              {/* Verified badge icon */}
              <span
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#4CC38A] ring-2 ring-[#0F1117] flex items-center justify-center text-[#08090C]"
                title="Verified Active Talent"
              >
                <CheckCircle2 className="w-3.5 h-3.5 fill-[#08090C] text-[#4CC38A]" />
              </span>
            </div>

            {/* Profile Identity Details */}
            <div className="space-y-1 min-w-0 flex-1">
              <span className="small-caps-label block text-[10px]">
                [● VERIFIED CAREER IDENTITY]
              </span>

              {/* Badge row matching Design System v2 standard */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#2F8C82]/15 text-[#2F8C82] font-mono text-[10.5px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F8C82] animate-pulse" />
                  <span>VERIFIED TALENT</span>
                </div>

                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-signal-amber/10 text-signal-amber font-mono text-[10.5px] font-semibold">
                  <Flame className="w-3 h-3 fill-signal-amber" />
                  <span>{profile.rankings?.currentStreak || 1}d Streak</span>
                </div>

                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-signal-green/10 text-signal-green font-mono text-[10.5px] font-semibold">
                  <ShieldCheck className="w-3 h-3 text-signal-green" />
                  <span>ATS 94% Compliant</span>
                </div>
              </div>

              {/* Name & Handle */}
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 pt-0.5">
                <h1 className="text-xl sm:text-2xl font-bold text-[#F4F5F7] tracking-tight break-words">
                  {profile.name}
                </h1>
                <span className="text-xs font-mono text-[#8B90A0] break-all">
                  @{profile.username}
                </span>
              </div>

              {/* Title / Headline */}
              <p className="text-xs sm:text-sm font-medium text-[#2F8C82]">
                {profile.headline || 'Aspiring Full-Stack Web Specialist'}
              </p>

              {/* University & Location */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#8B90A0] font-sans pt-0.5">
                <span className="flex items-center gap-1.5 text-[#F4F5F7] font-medium">
                  <Building className="w-3.5 h-3.5 text-[#2F8C82] flex-shrink-0" />
                  <span>{profile.institution}</span>
                </span>
                <span className="text-[#2A2E38]">•</span>
                <span className="flex items-center gap-1 font-mono text-[#8B90A0]">
                  <MapPin className="w-3.5 h-3.5 text-[#8B90A0] flex-shrink-0" />
                  <span>{profile.location}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick Action Triggers */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            {/* Share Profile Trigger */}
            <button
              type="button"
              onClick={handleShareProfile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[#8B90A0] hover:text-[#F4F5F7] text-xs font-semibold transition-all"
              title="Copy link to public portfolio"
            >
              {shareCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#4CC38A]" />
                  <span className="text-[#4CC38A]">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#2F8C82]" />
                  <span>Share</span>
                </>
              )}
            </button>

            {/* Edit Profile Trigger */}
            <button
              type="button"
              onClick={() =>
                openModal('edit_profile', {
                  name: profile.name,
                  username: profile.username,
                  headline: profile.headline,
                  institution: profile.institution,
                  location: profile.location,
                  resumeFileName: profile.resumeFileName,
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-bridge-teal hover:bg-[#287970] text-[#08090C] font-mono font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. TWO-COLUMN DASHBOARD LAYOUT (70% / 30%)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* ═════════════════════════════════════════════════════════════
            LEFT COLUMN (APPROX 70% — 8 COLUMNS ON LG)
        ═════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-5">
          {/* 1. CAREER SUMMARY & PRIMARY ARTIFACT (CONSOLIDATED OVERVIEW) */}
          <div className="bg-bridge-panel rounded-xl border border-bridge-border p-5 sm:p-6 space-y-4">
            {/* About Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-bridge-border/60">
                <div>
                  <span className="small-caps-label block mb-0.5 text-[10px]">[● PROFESSIONAL SUMMARY]</span>
                  <h3 className="text-base font-bold text-[#F4F5F7] tracking-tight">About</h3>
                </div>
                {profile.bio ? (
                  <button
                    type="button"
                    onClick={() => openModal('edit_about', { bio: profile.bio })}
                    className="p-1 rounded-md text-[#8B90A0] hover:text-[#2F8C82] hover:bg-white/[0.04] transition-colors"
                    title="Edit Bio"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openModal('edit_about', { bio: '' })}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#2F8C82]/10 text-[#2F8C82] hover:bg-[#2F8C82]/20 text-xs font-mono font-semibold transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Bio</span>
                  </button>
                )}
              </div>

              {profile.bio ? (
                <div className="text-xs sm:text-sm text-[#F4F5F7]/90 leading-relaxed font-sans pt-1">
                  <p className={bioExpanded ? '' : 'line-clamp-3'}>{profile.bio}</p>
                  <button
                    type="button"
                    onClick={() => setBioExpanded(!bioExpanded)}
                    className="mt-1.5 text-xs font-mono font-semibold text-[#2F8C82] hover:underline inline-flex items-center gap-1"
                  >
                    {bioExpanded ? (
                      <>
                        <span>Read less</span>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <span>Read more</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="py-2 text-xs text-[#8B90A0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>Add a short bio to introduce your engineering background, learning focus, and target domains.</span>
                  <button
                    type="button"
                    onClick={() => openModal('edit_about', { bio: '' })}
                    className="text-[#2F8C82] hover:underline font-semibold shrink-0"
                  >
                    + Add Bio
                  </button>
                </div>
              )}
            </div>

            {/* Primary Resume Section */}
            <div className="pt-2 border-t border-bridge-border/60">
              <div className="flex items-center justify-between pb-2 mb-1">
                <span className="small-caps-label text-[10px]">[● PRIMARY ARTIFACT]</span>
                <span className="text-[11px] font-mono text-[#2F8C82] font-medium">
                  {profile.resumeFileName ? (profile.resumeLastUpdated || 'ATS Compliant') : 'ATS Generator Ready'}
                </span>
              </div>

              {profile.resumeFileName ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#2F8C82]/15 text-[#2F8C82] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs sm:text-sm text-[#F4F5F7] font-mono">
                        {profile.resumeFileName}
                      </h4>
                      <p className="text-[11px] text-[#8B90A0] font-mono">
                        PDF Document • ATS Verified 94%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to="/resume-builder"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#F4F5F7] text-xs font-semibold transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#2F8C82]" />
                      <span>View / Edit</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => navigate('/resume-builder')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bridge-teal hover:bg-[#287970] text-[#08090C] font-mono font-bold text-xs transition-all shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#8B90A0]">
                  <span>No primary resume linked. Upload an existing document or compile with the AI generator.</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setResumeNameInput(`${profile.name || 'Student'}-Resume.pdf`);
                        setIsResumeModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#F4F5F7] font-semibold text-xs transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#2F8C82]" />
                      <span>Upload</span>
                    </button>
                    <Link
                      to="/resume-builder"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bridge-teal hover:bg-[#287970] text-[#08090C] font-mono font-bold text-xs transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. SKILLS & COMPETENCIES */}
          <div className="bg-bridge-panel rounded-xl border border-bridge-border p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-bridge-border/60">
              <div>
                <span className="small-caps-label block mb-0.5 text-[10px]">[● VERIFIED TECHNICAL PROFICIENCIES]</span>
                <h3 className="text-base font-bold text-[#F4F5F7] tracking-tight">Skills & Competencies</h3>
              </div>
              <button
                type="button"
                onClick={() =>
                  openModal('manage_skills', { skills: profile.technicalSkills })
                }
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8B90A0] hover:text-[#F4F5F7] text-xs font-semibold transition-all"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#2F8C82]" />
                <span>Manage</span>
              </button>
            </div>

            {profile.technicalSkills && profile.technicalSkills.length > 0 ? (
              <div className="space-y-3">
                <div>
                  <span className="small-caps-label block text-[#8B90A0] text-[10px] mb-1.5">
                    TECHNICAL STACK
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.technicalSkills.map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-xs font-mono text-[#F4F5F7] transition-all cursor-default flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2F8C82]" />
                        <span>{skill}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {profile.softSkills && profile.softSkills.length > 0 && (
                  <div className="pt-2 border-t border-bridge-border/40">
                    <span className="small-caps-label block text-[#8B90A0] text-[10px] mb-1.5">
                      CORE & LEADERSHIP
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.softSkills.map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-white/[0.02] text-xs font-mono text-[#8B90A0]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center space-y-2">
                <p className="text-xs text-[#8B90A0]">
                  Calibrate your skills to earn verified competency badges on your profile.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Link
                    to="/assessment"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bridge-teal hover:bg-[#287970] text-[#08090C] font-mono font-bold text-xs transition-all"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Take Assessment</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => openModal('manage_skills', { skills: [] })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8B90A0] hover:text-[#F4F5F7] font-semibold text-xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#2F8C82]" />
                    <span>Add Skill</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. VERIFIED ACTIVITY & STREAKS (STREAMLINED HEATMAP) */}
          <ContributionHeatmap />

          {/* 4. WORK EXPERIENCE */}
          <div className="bg-bridge-panel rounded-xl border border-bridge-border p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-bridge-border/60">
              <div>
                <span className="small-caps-label block mb-0.5 text-[10px]">[● EXPERIENCE TELEMETRY]</span>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#2F8C82]" />
                  <h3 className="text-base font-bold text-[#F4F5F7] tracking-tight">Work Experience</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openModal('add_experience')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8B90A0] hover:text-[#F4F5F7] text-xs font-semibold transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-[#2F8C82]" />
                <span>Add Experience</span>
              </button>
            </div>

            {profile.experiences && profile.experiences.length > 0 ? (
              <div className="divide-y divide-bridge-border/40">
                {profile.experiences.map((exp: any) => (
                  <div key={exp.id} className="py-4 first:pt-1 last:pb-0 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white/[0.04] text-[#2F8C82] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {exp.company ? exp.company.slice(0, 2).toUpperCase() : 'CO'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs sm:text-sm text-[#F4F5F7]">
                            {exp.title}
                          </h4>
                          <div className="text-xs text-[#F4F5F7]/80 font-medium">{exp.company}</div>
                          <div className="text-[11px] font-mono text-[#8B90A0] mt-0.5">
                            {exp.duration} • {exp.location}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openModal('edit_experience', exp)}
                        className="p-1 text-[#8B90A0] hover:text-[#2F8C82] transition-colors"
                        title="Edit Experience"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {exp.description && (
                      <p className="text-xs text-[#8B90A0] leading-relaxed pl-12">
                        {exp.description}
                      </p>
                    )}

                    {exp.skills && exp.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pl-12 pt-0.5">
                        {exp.skills.map((sk: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-white/[0.03] text-[10.5px] font-mono text-[#2F8C82]"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center space-y-2">
                <p className="text-xs text-[#8B90A0]">
                  No work experience entries yet. Add internships, part-time roles, or research experience.
                </p>
                <button
                  type="button"
                  onClick={() => openModal('add_experience')}
                  className="text-xs font-semibold text-[#2F8C82] hover:underline"
                >
                  + Add Experience
                </button>
              </div>
            )}
          </div>

          {/* 5. EDUCATION */}
          <div className="bg-bridge-panel rounded-xl border border-bridge-border p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-bridge-border/60">
              <div>
                <span className="small-caps-label block mb-0.5 text-[10px]">[● ACADEMIC BACKGROUND]</span>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#4CC38A]" />
                  <h3 className="text-base font-bold text-[#F4F5F7] tracking-tight">Education</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openModal('add_education')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8B90A0] hover:text-[#F4F5F7] text-xs font-semibold transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-[#2F8C82]" />
                <span>Add Education</span>
              </button>
            </div>

            {profile.educations && profile.educations.length > 0 ? (
              <div className="divide-y divide-bridge-border/40">
                {profile.educations.map((edu: any) => (
                  <div key={edu.id} className="py-3.5 first:pt-1 last:pb-0 space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white/[0.04] text-[#4CC38A] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {edu.institution ? edu.institution.slice(0, 2).toUpperCase() : 'ED'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs sm:text-sm text-[#F4F5F7]">
                            {edu.degree}
                          </h4>
                          <div className="text-xs text-[#F4F5F7]/80 font-medium">{edu.institution}</div>
                          <div className="text-[11px] font-mono text-[#8B90A0] mt-0.5">
                            {edu.duration} {edu.score && `• Score: ${edu.score}`}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openModal('edit_education', edu)}
                        className="p-1 text-[#8B90A0] hover:text-[#2F8C82] transition-colors"
                        title="Edit Education"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center space-y-2">
                <p className="text-xs text-[#8B90A0]">
                  No education entries added yet.
                </p>
                <button
                  type="button"
                  onClick={() => openModal('add_education')}
                  className="text-xs font-semibold text-[#2F8C82] hover:underline"
                >
                  + Add Education
                </button>
              </div>
            )}
          </div>

          {/* 6. PROJECTS & CERTIFICATIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Featured Projects */}
            <div className="bg-bridge-panel rounded-xl border border-bridge-border p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-bridge-border/60">
                <div>
                  <span className="small-caps-label block mb-0.5 text-[10px]">[● VERIFIED PROJECTS]</span>
                  <div className="flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-[#2F8C82]" />
                    <h4 className="text-sm font-bold text-[#F4F5F7] tracking-tight">Projects</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openModal('add_project')}
                  className="p-1 text-[#2F8C82] hover:bg-white/[0.04] rounded-md transition-colors"
                  title="Add Project"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {profile.projects && profile.projects.length > 0 ? (
                <div className="divide-y divide-bridge-border/30">
                  {profile.projects.map((proj: any) => (
                    <div key={proj.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#F4F5F7] truncate">{proj.title}</span>
                        {proj.githubUrl && (
                          <a
                            href={proj.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#8B90A0] hover:text-[#F4F5F7] transition-colors"
                          >
                            <Github className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-[#8B90A0] text-[11px] leading-relaxed line-clamp-2">
                        {proj.description}
                      </p>
                      <div className="flex flex-wrap gap-1 font-mono text-[10px] text-[#2F8C82] pt-0.5">
                        {proj.techStack?.map((t: string, i: number) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-white/[0.03]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-3 text-center text-xs text-[#8B90A0]">
                  No projects added yet.{' '}
                  <button type="button" onClick={() => openModal('add_project')} className="text-[#2F8C82] font-semibold hover:underline">
                    + Add
                  </button>
                </div>
              )}
            </div>

            {/* Certifications */}
            <div className="bg-bridge-panel rounded-xl border border-bridge-border p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-bridge-border/60">
                <div>
                  <span className="small-caps-label block mb-0.5 text-[10px]">[● CREDENTIALS]</span>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#2F8C82]" />
                    <h4 className="text-sm font-bold text-[#F4F5F7] tracking-tight">Certificates</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openModal('add_certificate')}
                  className="p-1 text-[#2F8C82] hover:bg-white/[0.04] rounded-md transition-colors"
                  title="Add Certificate"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {profile.certificates && profile.certificates.length > 0 ? (
                <div className="divide-y divide-bridge-border/30">
                  {profile.certificates.map((cert: any) => (
                    <div key={cert.id} className="py-2 first:pt-0 last:pb-0 space-y-0.5 text-xs">
                      <div className="font-semibold text-[#F4F5F7]">{cert.title}</div>
                      <div className="text-[11px] font-mono text-[#8B90A0]">
                        {cert.issuer} • {cert.date}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-3 text-center text-xs text-[#8B90A0]">
                  No certificates added yet.{' '}
                  <button type="button" onClick={() => openModal('add_certificate')} className="text-[#2F8C82] font-semibold hover:underline">
                    + Add
                  </button>
                </div>
              )}
            </div>

            {/* Responsibilities */}
            <div className="bg-bridge-panel rounded-xl border border-bridge-border p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-bridge-border/60">
                <div>
                  <span className="small-caps-label block mb-0.5 text-[10px]">[● RESPONSIBILITY]</span>
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#4CC38A]" />
                    <h4 className="text-sm font-bold text-[#F4F5F7] tracking-tight">Responsibilities</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openModal('add_responsibility')}
                  className="p-1 text-[#4CC38A] hover:bg-white/[0.04] rounded-md transition-colors"
                  title="Add Responsibility"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {profile.responsibilities && profile.responsibilities.length > 0 ? (
                <div className="divide-y divide-bridge-border/30">
                  {profile.responsibilities.map((resp: any) => (
                    <div key={resp.id} className="py-2 first:pt-0 last:pb-0 space-y-0.5 text-xs">
                      <div className="font-semibold text-[#F4F5F7]">{resp.title}</div>
                      <div className="text-[11px] font-mono text-[#8B90A0]">{resp.org}</div>
                      {resp.description && (
                        <p className="text-[#8B90A0] text-[11px] mt-0.5">{resp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-3 text-center text-xs text-[#8B90A0]">
                  No positions added yet.{' '}
                  <button type="button" onClick={() => openModal('add_responsibility')} className="text-[#4CC38A] font-semibold hover:underline">
                    + Add
                  </button>
                </div>
              )}
            </div>

            {/* Achievements */}
            <div className="bg-bridge-panel rounded-xl border border-bridge-border p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-bridge-border/60">
                <div>
                  <span className="small-caps-label block mb-0.5 text-[10px]">[● HONORS & AWARDS]</span>
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-signal-amber" />
                    <h4 className="text-sm font-bold text-[#F4F5F7] tracking-tight">Achievements</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openModal('add_achievement')}
                  className="p-1 text-signal-amber hover:bg-white/[0.04] rounded-md transition-colors"
                  title="Add Achievement"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {profile.achievements && profile.achievements.length > 0 ? (
                <div className="divide-y divide-bridge-border/30">
                  {profile.achievements.map((ach: any) => (
                    <div key={ach.id} className="py-2 first:pt-0 last:pb-0 space-y-0.5 text-xs">
                      <div className="font-semibold text-[#F4F5F7]">{ach.title}</div>
                      <div className="text-[11px] font-mono text-[#8B90A0]">{ach.org} • {ach.date}</div>
                      {ach.description && (
                        <p className="text-[#8B90A0] text-[11px] mt-0.5">{ach.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-3 text-center text-xs text-[#8B90A0]">
                  No honors added yet.{' '}
                  <button type="button" onClick={() => openModal('add_achievement')} className="text-signal-amber font-semibold hover:underline">
                    + Add
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 7. SOCIAL & PROFESSIONAL PROFILES */}
          <div className="bg-bridge-panel rounded-xl border border-bridge-border p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-bridge-border/60">
              <div>
                <span className="small-caps-label block mb-0.5 text-[10px]">[● CONNECTED PLATFORMS]</span>
                <h3 className="text-base font-bold text-[#F4F5F7] tracking-tight">
                  Social & Professional Profiles
                </h3>
              </div>
              <button
                type="button"
                onClick={() => openModal('edit_socials', profile.socials)}
                className="p-1 rounded-md text-[#8B90A0] hover:text-[#2F8C82] hover:bg-white/[0.04] transition-colors"
                title="Edit Socials"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            {profile.socials && Object.values(profile.socials).some(Boolean) ? (
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {profile.socials.linkedin && (
                  <a
                    href={profile.socials.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-xs font-medium text-[#8B90A0] hover:text-[#F4F5F7] transition-all"
                  >
                    <Linkedin className="w-3.5 h-3.5 text-[#2F8C82]" />
                    <span>LinkedIn</span>
                  </a>
                )}

                {profile.socials.github && (
                  <a
                    href={profile.socials.github}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-xs font-medium text-[#8B90A0] hover:text-[#F4F5F7] transition-all"
                  >
                    <Github className="w-3.5 h-3.5 text-[#F4F5F7]" />
                    <span>GitHub</span>
                  </a>
                )}

                {profile.socials.twitter && (
                  <a
                    href={profile.socials.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-xs font-medium text-[#8B90A0] hover:text-[#F4F5F7] transition-all"
                  >
                    <Twitter className="w-3.5 h-3.5 text-[#2F8C82]" />
                    <span>X (Twitter)</span>
                  </a>
                )}

                {profile.socials.leetcode && (
                  <a
                    href={profile.socials.leetcode}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-xs font-medium text-[#8B90A0] hover:text-[#F4F5F7] transition-all"
                  >
                    <Code className="w-3.5 h-3.5 text-signal-amber" />
                    <span>LeetCode</span>
                  </a>
                )}

                {profile.socials.website && (
                  <a
                    href={profile.socials.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-xs font-medium text-[#8B90A0] hover:text-[#F4F5F7] transition-all"
                  >
                    <Globe className="w-3.5 h-3.5 text-[#2F8C82]" />
                    <span>Portfolio</span>
                  </a>
                )}
              </div>
            ) : (
              <div className="py-3 text-center text-xs text-[#8B90A0]">
                Connect your LinkedIn, GitHub, or personal portfolio.{' '}
                <button type="button" onClick={() => openModal('edit_socials', {})} className="text-[#2F8C82] font-semibold hover:underline">
                  + Add Links
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════
            RIGHT SIDEBAR (APPROX 30% — 4 COLUMNS ON LG)
        ═════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-5 lg:sticky lg:top-20">
          {/* 1. AI CAREER ASSISTANT CARD */}
          <div className="bg-bridge-panel rounded-xl border border-bridge-border p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="small-caps-label text-[10px]">[● VECTOR CO-PILOT]</span>
                <Sparkles className="w-4 h-4 text-[#2F8C82]" />
              </div>
              <h3 className="text-base font-bold text-[#F4F5F7] tracking-tight mt-1">
                Build Targeted Resume
              </h3>
              <p className="text-xs text-[#8B90A0] mt-0.5">
                Customize your credentials for specific job vectors
              </p>
            </div>

            <form onSubmit={handleStartResumeCreation} className="space-y-3.5 text-xs font-sans">
              <div>
                <label className="block font-semibold text-[#8B90A0] mb-1 font-mono text-[10.5px] uppercase tracking-wider">
                  Target Domain
                </label>
                <select
                  value={resumeInterest}
                  onChange={(e) => setResumeInterest(e.target.value)}
                  className="w-full bg-white/[0.03] border border-bridge-border/70 rounded-lg px-3 py-2 text-xs text-[#F4F5F7] focus:outline-none focus:border-[#2F8C82] font-medium"
                >
                  <option value="Full-Stack Software Engineering">Full-Stack Software Engineering</option>
                  <option value="AI & Machine Learning Systems">AI & Machine Learning Systems</option>
                  <option value="Cloud Architecture & DevOps">Cloud Architecture & DevOps</option>
                  <option value="UI/UX Product Design">UI/UX Product Design</option>
                  <option value="Embedded Systems & IoT">Embedded Systems & IoT</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#8B90A0] mb-1 font-mono text-[10.5px] uppercase tracking-wider">
                  Preferred Work Location
                </label>
                <input
                  type="text"
                  value={resumeLocation}
                  onChange={(e) => setResumeLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, Remote, Delhi NCR"
                  className="w-full bg-white/[0.03] border border-bridge-border/70 rounded-lg px-3 py-2 text-xs text-[#F4F5F7] focus:outline-none focus:border-[#2F8C82] font-mono"
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-bridge-teal hover:bg-[#287970] text-[#08090C] font-mono font-bold text-xs transition-all cursor-pointer"
                >
                  <span>Launch AI Resume Builder</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>

          {/* 2. GLOBAL COMPETENCY TELEMETRY */}
          <div className="bg-bridge-panel rounded-xl border border-bridge-border p-5 space-y-4 font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-bridge-border/60">
              <span className="small-caps-label text-[10px]">
                [● GLOBAL COMPETENCY TELEMETRY]
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-[#2F8C82]/15 text-[#2F8C82]">
                Level {profile.rankings?.level || 1}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3">
                <span className="small-caps-label truncate text-[10px] block mb-1">TOTAL POINTS</span>
                <div className="font-mono text-xl font-semibold text-[#F4F5F7]">
                  {(profile.rankings?.totalPoints || 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-[#8B90A0]">Verified score</span>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3">
                <span className="small-caps-label truncate text-[10px] block mb-1">TOTAL BADGES</span>
                <div className="font-mono text-xl font-semibold text-[#F4F5F7]">
                  {profile.rankings?.totalBadges || 0}
                </div>
                <span className="text-[11px] text-[#8B90A0]">Platform awards</span>
              </div>
            </div>

            {/* Level Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-[#8B90A0]">
                <span>Progress to Level {(profile.rankings?.level || 1) + 1}</span>
                <span className="font-bold text-[#2F8C82]">{profile.rankings?.progressToNextLevel || 0}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2F8C82] rounded-full transition-all duration-500"
                  style={{ width: `${profile.rankings?.progressToNextLevel || 0}%` }}
                />
              </div>
            </div>

            {/* Profile Completion Bar */}
            <div className="pt-2 border-t border-bridge-border/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#8B90A0]">Profile Completeness</span>
                <span className="font-mono font-bold text-[#4CC38A]">{profileStrength}% Complete</span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#2F8C82] to-[#4CC38A] rounded-full transition-all duration-500"
                  style={{ width: `${profileStrength}%` }}
                />
              </div>
              <p className="text-[#8B90A0] text-[11px] leading-relaxed">
                {profileStrength < 100
                  ? 'Complete your Bio, Skills assessment, and Experience sections to achieve a 100% verified All-Star ranking.'
                  : 'Your profile is fully verified and optimized for top industry recruiter matching.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODULAR EDIT MODAL & AVATAR UPLOAD MODAL
      ───────────────────────────────────────────────────────────── */}
      <ProfileEditModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        initialData={modalState.initialData}
        onClose={closeModal}
        onSave={handleSaveModalData}
      />

      {user?.studentProfile?.id && (
        <AvatarUploadModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          studentId={user.studentProfile.id}
          currentAvatarUrl={profile.avatarUrl}
          currentName={profile.name}
          onAvatarUpdated={(newAvatarUrl) => {
            setProfile((p: any) => ({ ...p, avatarUrl: newAvatarUrl }));
            refreshUser();
          }}
        />
      )}

      {/* Inline Resume Attachment Modal */}
      {isResumeModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-bridge-panel rounded-xl border border-bridge-border max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-bridge-border/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#2F8C82]/15 text-[#2F8C82] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F4F5F7] tracking-tight">Attach Resume Document</h3>
                  <p className="text-[11px] text-[#8B90A0]">Specify the title for your verified profile resume</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#8B90A0] block">Document Title / Filename</label>
              <input
                type="text"
                value={resumeNameInput}
                onChange={(e) => setResumeNameInput(e.target.value)}
                placeholder="e.g. John-Doe-Resume.pdf"
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-bridge-border/70 text-[#F4F5F7] text-xs focus:outline-none focus:border-[#2F8C82] font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-bridge-border/60">
              <button
                type="button"
                onClick={() => setIsResumeModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg text-[#8B90A0] hover:text-[#F4F5F7] hover:bg-white/[0.04] text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (resumeNameInput.trim()) {
                    handleSaveModalData('edit_profile', { ...profile, resumeFileName: resumeNameInput.trim() });
                    setIsResumeModalOpen(false);
                  }
                }}
                className="px-3.5 py-1.5 rounded-lg bg-bridge-teal hover:bg-[#287970] text-[#08090C] font-mono font-bold text-xs transition-all"
              >
                Save & Attach
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerProfileDashboard;
