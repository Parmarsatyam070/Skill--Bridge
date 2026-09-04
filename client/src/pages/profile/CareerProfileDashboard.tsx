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
  const [profile, setProfile] = useState<any>({
    name: user?.name || '',
    username: user?.email ? user.email.split('@')[0] : 'user',
    headline: user?.studentProfile?.targetDomain ? `Aspiring ${user.studentProfile.targetDomain} Specialist` : 'Student Developer',
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

      // Diagnostic root-cause tracing for full name integrity
      if (process.env.NODE_ENV !== 'production' || true) {
        console.log('[CareerProfile] Raw /students/:id payload:', {
          apiStudentName: s?.name,
          authUserName: user?.name,
        });
        if (s?.name && user?.name && s.name.trim().split(/\s+/).length < user.name.trim().split(/\s+/).length) {
          console.warn(`[CareerProfile WARN] s.name "${s.name}" has fewer words than user.name "${user.name}". Using full registered name.`);
        }
      }

      const fullName = (s?.name && s.name.trim().length >= (user?.name?.trim().length || 0))
        ? s.name.trim()
        : (user?.name || s?.name || 'Student');

      setProfile({
        name: fullName,
        username: s?.email ? s.email.split('@')[0] : (user?.email ? user.email.split('@')[0] : 'student'),
        headline: s?.headline || (s?.targetDomain ? `Aspiring ${s.targetDomain} Specialist` : 'Student Developer'),
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
    return nameStr
      .trim()
      .split(/\s+/)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* ─────────────────────────────────────────────────────────────
          MAIN 70% / 30% TWO-COLUMN LAYOUT
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ═════════════════════════════════════════════════════════════
            LEFT COLUMN (APPROX 70% — 8 COLUMNS ON LG)
        ═════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. PROFILE HEADER CARD */}
          <div className="bg-console-panel rounded-2xl border border-console-border p-6 sm:p-8 shadow-sm relative overflow-hidden">
            {/* Top decorative gradient banner */}
            <div className="h-24 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 bg-gradient-to-r from-bridge-teal via-emerald-600 to-indigo-700 relative" />

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-4">
              {/* Avatar + Info */}
              <div className="flex items-end gap-4">
                <div className="relative group">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-console-panel shadow-md bg-console-panel-raised"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-bridge-teal text-white font-serif font-bold text-2xl flex items-center justify-center border-4 border-console-panel shadow-md">
                      {getInitials(profile.name)}
                    </div>
                  )}

                  {/* Upload photo prompt */}
                  <button
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="absolute inset-0 rounded-full bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold cursor-pointer"
                    title="Upload or change photo"
                  >
                    <Upload className="w-4 h-4 mb-0.5" />
                    <span>Upload</span>
                  </button>

                  <span
                    className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-status-green border-2 border-console-panel flex items-center justify-center text-white"
                    title="Active Verified Talent"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="space-y-0.5 pb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-console-text">
                      {profile.name}
                    </h1>
                    <span className="text-xs font-mono font-medium text-console-text-muted">
                      @{profile.username}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-bridge-teal">
                    {profile.headline}
                  </p>
                </div>
              </div>

              {/* Edit Profile Action Button */}
              <button
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-console-panel-raised hover:border-bridge-teal border border-console-border text-console-text text-xs font-semibold shadow-xs transition-all self-start sm:self-auto"
              >
                <Edit3 className="w-3.5 h-3.5 text-console-text-muted" />
                <span>Edit Profile</span>
              </button>
            </div>

            {/* University & Streak Summary Row */}
            <div className="pt-3 border-t border-console-border flex flex-wrap items-center justify-between gap-3 text-xs text-console-text-muted font-sans">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-bridge-teal flex-shrink-0" />
                <span className="font-medium text-console-text">{profile.institution}</span>
                <span className="text-console-border">•</span>
                <span className="flex items-center gap-1 text-console-text-muted font-mono">
                  <MapPin className="w-3.5 h-3.5 text-console-text-muted" />
                  {profile.location}
                </span>
              </div>

              {/* Daily Streak Highlight */}
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-industry-amber/10 border border-industry-amber/30 text-industry-amber font-mono text-[11px] font-bold">
                  <Flame className="w-3.5 h-3.5 fill-industry-amber" />
                  <span>{profile.rankings?.currentStreak || 1}-day active streak</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. ABOUT BIO SECTION */}
          <div className="bg-console-panel rounded-2xl border border-console-border p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-console-border">
              <h3 className="font-serif text-base font-bold text-console-text">About</h3>
              {profile.bio ? (
                <button
                  onClick={() => openModal('edit_about', { bio: profile.bio })}
                  className="p-1.5 rounded-lg text-console-text-muted hover:text-bridge-teal hover:bg-console-panel-raised transition-colors"
                  title="Edit Bio"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => openModal('edit_about', { bio: '' })}
                  className="flex items-center gap-1 px-3 py-1 rounded-xl bg-bridge-teal/15 text-bridge-teal font-semibold text-xs hover:bg-bridge-teal/25 transition-colors border border-bridge-teal/30"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              )}
            </div>

            {profile.bio ? (
              <div className="text-xs sm:text-sm text-console-text leading-relaxed font-sans">
                <p className={bioExpanded ? '' : 'line-clamp-3'}>{profile.bio}</p>
                <button
                  onClick={() => setBioExpanded(!bioExpanded)}
                  className="mt-2 text-xs font-semibold text-bridge-teal hover:underline inline-flex items-center gap-1"
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
              <div className="p-5 text-center bg-console-panel-raised rounded-xl border border-console-border space-y-2">
                <p className="text-xs text-console-text-muted">
                  Add a short bio about yourself to highlight your technical background, projects, and career aspirations.
                </p>
                <button
                  onClick={() => openModal('edit_about', { bio: '' })}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-bridge-teal text-white font-semibold text-xs shadow-xs hover:bg-bridge-teal/90 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Bio</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. RESUME ATTACHMENT CARD */}
          <div className="bg-console-panel rounded-2xl border border-console-border p-5 sm:p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-console-border">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-console-text-muted">
                Primary Career Document
              </span>
              {profile.resumeFileName && (
                <span className="text-[11px] font-mono text-console-text-muted">
                  {profile.resumeLastUpdated || 'ATS Compliant'}
                </span>
              )}
            </div>

            {profile.resumeFileName ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-console-panel-raised border border-console-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-status-red/10 text-status-red border border-status-red/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs sm:text-sm text-console-text font-mono">
                      {profile.resumeFileName}
                    </h4>
                    <p className="text-[11px] text-console-text-muted font-mono">
                      PDF Document • ATS Verified
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/resume-builder"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-console-panel border border-console-border hover:border-bridge-teal text-console-text text-xs font-semibold transition-colors shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-console-text-muted" />
                    <span>View / Edit</span>
                  </Link>
                  <button
                    onClick={() => {
                      navigate('/resume-builder');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white text-xs font-semibold transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center bg-console-panel-raised rounded-xl border border-console-border space-y-3">
                <div className="w-10 h-10 rounded-xl bg-console-panel border border-console-border flex items-center justify-center mx-auto text-console-text-muted">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-console-text">No resume yet</h4>
                  <p className="text-xs text-console-text-muted mt-1">
                    Upload an existing resume or build a tailored, ATS-compliant resume with our AI generator.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    onClick={() => {
                      setResumeNameInput(`${profile.name || 'Student'}-Resume.pdf`);
                      setIsResumeModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-console-panel border border-console-border text-console-text font-semibold text-xs hover:border-bridge-teal transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-bridge-teal" />
                    <span>Upload resume</span>
                  </button>
                  <Link
                    to="/resume-builder"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-bridge-teal text-white font-semibold text-xs shadow-xs hover:bg-bridge-teal/90 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate with AI</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 4. SKILLS SECTION */}
          <div className="bg-console-panel rounded-2xl border border-console-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-console-border">
              <div>
                <h3 className="font-serif text-base font-bold text-console-text">Skills & Competencies</h3>
                <p className="text-xs text-console-text-muted">
                  Verified technical proficiencies and engineering tools
                </p>
              </div>
              <button
                onClick={() =>
                  openModal('manage_skills', { skills: profile.technicalSkills })
                }
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-console-panel-raised hover:border-bridge-teal border border-console-border text-console-text text-xs font-semibold transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Manage</span>
              </button>
            </div>

            {profile.technicalSkills && profile.technicalSkills.length > 0 ? (
              <>
                <div className="space-y-2">
                  <span className="text-[11px] font-mono font-semibold text-console-text-muted uppercase tracking-wider block">
                    Technical Stack
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {profile.technicalSkills.map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3.5 py-1.5 rounded-full bg-console-panel-raised hover:bg-bridge-teal/15 border border-console-border hover:border-bridge-teal text-xs font-mono font-medium text-console-text transition-colors cursor-default shadow-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {profile.softSkills && profile.softSkills.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-console-border">
                    <span className="text-[11px] font-mono font-semibold text-console-text-muted uppercase tracking-wider block">
                      Core & Leadership
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {profile.softSkills.map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full bg-campus-blue/20 border border-campus-blue/30 text-xs font-sans font-medium text-[#8cb4e6] shadow-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 text-center bg-console-panel-raised rounded-xl border border-console-border space-y-3">
                <p className="text-xs text-console-text-muted">
                  Skills genuinely come from your assessment results and manual inventory additions.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link
                    to="/assessment"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-bridge-teal text-white font-semibold text-xs shadow-xs hover:bg-bridge-teal/90 transition-all"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Take Skill Assessment</span>
                  </Link>
                  <button
                    onClick={() => openModal('manage_skills', { skills: [] })}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-console-panel border border-console-border text-console-text font-semibold text-xs hover:border-bridge-teal transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Manual Skill</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 5. WORK EXPERIENCE SECTION */}
          <div className="bg-console-panel rounded-2xl border border-console-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-console-border">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-bridge-teal" />
                <h3 className="font-serif text-base font-bold text-console-text">Work Experience</h3>
              </div>
              <button
                onClick={() => openModal('add_experience')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-bridge-teal/15 hover:bg-bridge-teal/25 border border-bridge-teal/30 text-bridge-teal text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Experience</span>
              </button>
            </div>

            {profile.experiences && profile.experiences.length > 0 ? (
              <div className="space-y-4 divide-y divide-console-border">
                {profile.experiences.map((exp: any) => (
                  <div key={exp.id} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-console-panel-raised border border-console-border text-console-text font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {exp.company ? exp.company.slice(0, 2).toUpperCase() : 'CO'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs sm:text-sm text-console-text">
                            {exp.title}
                          </h4>
                          <div className="text-xs text-console-text-muted font-medium">{exp.company}</div>
                          <div className="text-[11px] font-mono text-console-text-muted mt-0.5">
                            {exp.duration} • {exp.location}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => openModal('edit_experience', exp)}
                        className="p-1 text-console-text-muted hover:text-bridge-teal"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-console-text-muted leading-relaxed font-sans pl-13">
                      {exp.description}
                    </p>

                    {exp.skills && exp.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pl-13 pt-1">
                        {exp.skills.map((sk: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-console-bg border border-console-border text-[10.5px] font-mono text-console-text"
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
              <div className="p-6 text-center bg-console-panel-raised rounded-xl border border-console-border space-y-2">
                <p className="text-xs text-console-text-muted">
                  No work experience added yet. Add your internships, part-time roles, or open-source projects.
                </p>
                <button
                  onClick={() => openModal('add_experience')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-bridge-teal text-white font-semibold text-xs shadow-xs hover:bg-bridge-teal/90 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Experience</span>
                </button>
              </div>
            )}
          </div>

          {/* 6. EDUCATION SECTION */}
          <div className="bg-console-panel rounded-2xl border border-console-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-console-border">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-bridge-teal" />
                <h3 className="font-serif text-base font-bold text-console-text">Education</h3>
              </div>
              <button
                onClick={() => openModal('add_education')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-bridge-teal/15 hover:bg-bridge-teal/25 border border-bridge-teal/30 text-bridge-teal text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Education</span>
              </button>
            </div>

            {profile.educations && profile.educations.length > 0 ? (
              <div className="space-y-4 divide-y divide-console-border">
                {profile.educations.map((edu: any) => (
                  <div key={edu.id} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-status-green/10 text-status-green border border-status-green/20 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {edu.institution ? edu.institution.slice(0, 2).toUpperCase() : 'ED'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs sm:text-sm text-console-text">
                            {edu.degree}
                          </h4>
                          <div className="text-xs text-console-text-muted font-medium">{edu.institution}</div>
                          <div className="text-[11px] font-mono text-console-text-muted mt-0.5">
                            {edu.duration} {edu.score && `• Score: ${edu.score}`}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => openModal('edit_education', edu)}
                        className="p-1 text-console-text-muted hover:text-bridge-teal"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-console-panel-raised rounded-xl border border-console-border space-y-2">
                <p className="text-xs text-console-text-muted">
                  No education entries added yet.
                </p>
                <button
                  onClick={() => openModal('add_education')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-bridge-teal text-white font-semibold text-xs shadow-xs hover:bg-bridge-teal/90 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Education</span>
                </button>
              </div>
            )}
          </div>

          {/* 7. PROJECTS & CERTIFICATIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Featured Projects */}
            <div className="bg-console-panel rounded-2xl border border-console-border p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-console-border">
                <div className="flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-bridge-teal" />
                  <h4 className="font-serif font-bold text-sm text-console-text">Projects</h4>
                </div>
                <button
                  onClick={() => openModal('add_project')}
                  className="p-1 text-bridge-teal hover:bg-console-panel-raised rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {profile.projects && profile.projects.length > 0 ? (
                <div className="space-y-3">
                  {profile.projects.map((proj: any) => (
                    <div key={proj.id} className="p-3 rounded-xl bg-console-panel-raised border border-console-border space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-console-text truncate">{proj.title}</span>
                        {proj.githubUrl && (
                          <a
                            href={proj.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-console-text-muted hover:text-console-text"
                          >
                            <Github className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-console-text-muted text-[11px] leading-relaxed line-clamp-2">
                        {proj.description}
                      </p>
                      <div className="flex flex-wrap gap-1 font-mono text-[10px] text-bridge-teal">
                        {proj.techStack?.map((t: string, i: number) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-bridge-teal/15 border border-bridge-teal/30">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center bg-console-panel-raised rounded-xl border border-console-border text-xs text-console-text-muted">
                  No projects added yet.{' '}
                  <button onClick={() => openModal('add_project')} className="text-bridge-teal font-semibold hover:underline">
                    + Add Project
                  </button>
                </div>
              )}
            </div>

            {/* Certifications */}
            <div className="bg-console-panel rounded-2xl border border-console-border p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-console-border">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-campus-blue" />
                  <h4 className="font-serif font-bold text-sm text-console-text">Certificates</h4>
                </div>
                <button
                  onClick={() => openModal('add_certificate')}
                  className="p-1 text-campus-blue hover:bg-console-panel-raised rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {profile.certificates && profile.certificates.length > 0 ? (
                <div className="space-y-3">
                  {profile.certificates.map((cert: any) => (
                    <div key={cert.id} className="p-3 rounded-xl bg-console-panel-raised border border-console-border space-y-1 text-xs">
                      <div className="font-bold text-console-text">{cert.title}</div>
                      <div className="text-[11px] font-mono text-console-text-muted">
                        {cert.issuer} • {cert.date}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center bg-console-panel-raised rounded-xl border border-console-border text-xs text-console-text-muted">
                  No certificates added yet.{' '}
                  <button onClick={() => openModal('add_certificate')} className="text-campus-blue font-semibold hover:underline">
                    + Add Certificate
                  </button>
                </div>
              )}
            </div>

            {/* Responsibilities */}
            <div className="bg-console-panel rounded-2xl border border-console-border p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-console-border">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-status-green" />
                  <h4 className="font-serif font-bold text-sm text-console-text">Responsibilities</h4>
                </div>
                <button
                  onClick={() => openModal('add_responsibility')}
                  className="p-1 text-status-green hover:bg-console-panel-raised rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {profile.responsibilities && profile.responsibilities.length > 0 ? (
                <div className="space-y-3">
                  {profile.responsibilities.map((resp: any) => (
                    <div key={resp.id} className="p-3 rounded-xl bg-console-panel-raised border border-console-border space-y-1 text-xs">
                      <div className="font-bold text-console-text">{resp.title}</div>
                      <div className="text-[11px] font-mono text-console-text-muted">{resp.org}</div>
                      <p className="text-console-text-muted text-[11px]">{resp.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center bg-console-panel-raised rounded-xl border border-console-border text-xs text-console-text-muted">
                  No positions added yet.{' '}
                  <button onClick={() => openModal('add_responsibility')} className="text-status-green font-semibold hover:underline">
                    + Add
                  </button>
                </div>
              )}
            </div>

            {/* Achievements */}
            <div className="bg-console-panel rounded-2xl border border-console-border p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-console-border">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-industry-amber" />
                  <h4 className="font-serif font-bold text-sm text-console-text">Achievements</h4>
                </div>
                <button
                  onClick={() => openModal('add_achievement')}
                  className="p-1 text-industry-amber hover:bg-console-panel-raised rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {profile.achievements && profile.achievements.length > 0 ? (
                <div className="space-y-3">
                  {profile.achievements.map((ach: any) => (
                    <div key={ach.id} className="p-3 rounded-xl bg-console-panel-raised border border-console-border space-y-1 text-xs">
                      <div className="font-bold text-console-text">{ach.title}</div>
                      <div className="text-[11px] font-mono text-console-text-muted">{ach.org} • {ach.date}</div>
                      <p className="text-console-text-muted text-[11px]">{ach.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center bg-console-panel-raised rounded-xl border border-console-border text-xs text-console-text-muted">
                  No honors added yet.{' '}
                  <button onClick={() => openModal('add_achievement')} className="text-industry-amber font-semibold hover:underline">
                    + Add
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 8. SOCIAL & PROFESSIONAL PLATFORMS ROW */}
          <div className="bg-console-panel rounded-2xl border border-console-border p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-console-border">
              <h3 className="font-serif text-base font-bold text-console-text">
                Social & Professional Profiles
              </h3>
              <button
                onClick={() => openModal('edit_socials', profile.socials)}
                className="p-1.5 rounded-lg text-console-text-muted hover:text-bridge-teal hover:bg-console-panel-raised transition-colors"
                title="Edit Socials"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {profile.socials && Object.values(profile.socials).some(Boolean) ? (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {profile.socials.linkedin && (
                  <a
                    href={profile.socials.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-console-panel-raised hover:bg-blue-900/20 border border-console-border hover:border-blue-400 text-xs font-semibold text-console-text transition-colors shadow-xs"
                  >
                    <Linkedin className="w-4 h-4 text-blue-400" />
                    <span>LinkedIn</span>
                  </a>
                )}

                {profile.socials.github && (
                  <a
                    href={profile.socials.github}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-console-panel-raised hover:bg-console-border border border-console-border hover:border-console-text text-xs font-semibold text-console-text transition-colors shadow-xs"
                  >
                    <Github className="w-4 h-4 text-console-text" />
                    <span>GitHub</span>
                  </a>
                )}

                {profile.socials.twitter && (
                  <a
                    href={profile.socials.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-console-panel-raised hover:bg-sky-900/20 border border-console-border hover:border-sky-400 text-xs font-semibold text-console-text transition-colors shadow-xs"
                  >
                    <Twitter className="w-4 h-4 text-sky-400" />
                    <span>X (Twitter)</span>
                  </a>
                )}

                {profile.socials.leetcode && (
                  <a
                    href={profile.socials.leetcode}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-console-panel-raised hover:bg-amber-900/20 border border-console-border hover:border-amber-400 text-xs font-semibold text-console-text transition-colors shadow-xs"
                  >
                    <Code className="w-4 h-4 text-amber-400" />
                    <span>LeetCode</span>
                  </a>
                )}

                {profile.socials.website && (
                  <a
                    href={profile.socials.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-console-panel-raised hover:bg-bridge-teal/20 border border-console-border hover:border-bridge-teal text-xs font-semibold text-console-text transition-colors shadow-xs"
                  >
                    <Globe className="w-4 h-4 text-bridge-teal" />
                    <span>Portfolio</span>
                  </a>
                )}
              </div>
            ) : (
              <div className="p-4 text-center bg-console-panel-raised rounded-xl border border-console-border text-xs text-console-text-muted">
                Connect your LinkedIn, GitHub, or personal portfolio.{' '}
                <button onClick={() => openModal('edit_socials', {})} className="text-bridge-teal font-semibold hover:underline">
                  + Add Links
                </button>
              </div>
            )}
          </div>

          {/* 9. ACTIVITY STREAKS CONTRIBUTION HEATMAP */}
          <ContributionHeatmap />
        </div>

        {/* ═════════════════════════════════════════════════════════════
            RIGHT SIDEBAR (APPROX 30% — 4 COLUMNS ON LG)
        ═════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
          {/* 1. RESUME CREATION WIDGET */}
          <div className="bg-console-panel rounded-2xl border border-console-border shadow-sm overflow-hidden space-y-4">
            <div className="bg-gradient-to-br from-bridge-teal via-emerald-600 to-indigo-700 p-5 text-white relative">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-mono uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                  AI Career Assistant
                </span>
                <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
              </div>
              <h3 className="font-serif text-lg font-bold mt-2">Build Targeted Resume</h3>
              <p className="text-xs text-teal-100 mt-1">
                Customize your portfolio for specific job vectors
              </p>
            </div>

            <form onSubmit={handleStartResumeCreation} className="p-5 pt-0 space-y-4 text-xs font-sans">
              <div>
                <label className="block font-semibold text-console-text mb-1.5">
                  Target Domain
                </label>
                <select
                  value={resumeInterest}
                  onChange={(e) => setResumeInterest(e.target.value)}
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2.5 text-xs text-console-text focus:outline-none focus:border-bridge-teal font-medium"
                >
                  <option value="Full-Stack Software Engineering">Full-Stack Software Engineering</option>
                  <option value="AI & Machine Learning Systems">AI & Machine Learning Systems</option>
                  <option value="Cloud Architecture & DevOps">Cloud Architecture & DevOps</option>
                  <option value="UI/UX Product Design">UI/UX Product Design</option>
                  <option value="Embedded Systems & IoT">Embedded Systems & IoT</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-console-text mb-1.5">
                  Preferred Work Location
                </label>
                <input
                  type="text"
                  value={resumeLocation}
                  onChange={(e) => setResumeLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, Remote, Delhi NCR"
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text focus:outline-none focus:border-bridge-teal font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-console-border">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <span>Launch AI Resume Builder</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>

          {/* 2. DYNAMIC REAL RANKINGS WIDGET */}
          <div className="bg-console-panel rounded-2xl border border-console-border p-6 shadow-sm space-y-4 font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-console-border">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-console-text-muted">
                Global Competency Ranking
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-industry-amber/10 text-industry-amber border border-industry-amber/30">
                Level {profile.rankings?.level || 1}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3.5 rounded-xl bg-console-panel-raised border border-console-border space-y-0.5">
                <div className="text-[11px] text-console-text-muted font-sans">Total Points</div>
                <div className="text-xl font-bold text-bridge-teal">
                  {(profile.rankings?.totalPoints || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-status-green font-sans">Verified score</div>
              </div>

              <div className="p-3.5 rounded-xl bg-console-panel-raised border border-console-border space-y-0.5">
                <div className="text-[11px] text-console-text-muted font-sans">Total Badges</div>
                <div className="text-xl font-bold text-industry-amber">
                  {profile.rankings?.totalBadges || 0} Badges
                </div>
                <div className="text-[10px] text-console-text-muted font-sans">Platform awards</div>
              </div>
            </div>

            {/* Level Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-console-text-muted">
                <span>Progress to Level {(profile.rankings?.level || 1) + 1}</span>
                <span className="font-bold text-bridge-teal">{profile.rankings?.progressToNextLevel || 0}%</span>
              </div>
              <div className="w-full h-2 bg-console-bg rounded-full overflow-hidden border border-console-border">
                <div
                  className="h-full bg-gradient-to-r from-bridge-teal to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${profile.rankings?.progressToNextLevel || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* 3. PROFILE COMPLETENESS GAUGE */}
          <div className="bg-console-panel rounded-2xl border border-console-border p-5 shadow-sm space-y-3 font-sans text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-console-text">Profile Strength</span>
              <span className="font-mono font-bold text-bridge-teal">{profileStrength}% Complete</span>
            </div>
            <div className="w-full h-2 bg-console-bg rounded-full overflow-hidden border border-console-border">
              <div
                className="h-full bg-bridge-teal rounded-full transition-all duration-500"
                style={{ width: `${profileStrength}%` }}
              />
            </div>
            <p className="text-console-text-muted text-[11px] leading-relaxed">
              {profileStrength < 100
                ? 'Complete your Bio, Skills assessment, and Experience sections to achieve a 100% verified All-Star ranking.'
                : 'Your profile is fully verified and optimized for top industry recruiter matching.'}
            </p>
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

      {/* Inline Resume Attachment Modal (Replacing window.prompt) */}
      {isResumeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-console-panel rounded-2xl border border-console-border max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-console-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-bridge-teal/15 text-bridge-teal border border-bridge-teal/30 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-console-text">Attach Resume Document</h3>
                  <p className="text-[11px] text-console-text-muted">Specify the title for your verified profile resume</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-console-text block">Document Title / Filename</label>
              <input
                type="text"
                value={resumeNameInput}
                onChange={(e) => setResumeNameInput(e.target.value)}
                placeholder="e.g. John-Doe-Resume.pdf"
                className="w-full px-3.5 py-2.5 rounded-xl bg-console-bg border border-console-border text-console-text text-xs focus:outline-none focus:border-bridge-teal font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-console-border">
              <button
                type="button"
                onClick={() => setIsResumeModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-console-border text-console-text-muted hover:text-console-text text-xs font-medium transition-colors"
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
                className="px-4 py-2 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white text-xs font-medium transition-colors shadow-xs"
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
