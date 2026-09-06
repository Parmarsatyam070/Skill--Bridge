import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  MoreVertical,
  Download,
  Edit3,
  Copy,
  Trash2,
  CheckCircle2,
  Sparkles,
  Eye,
  ArrowLeft,
  Search,
  Layers,
  Save,
  Check,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Upload,
  User,
  GraduationCap,
  Briefcase,
  Award,
  Code,
  Globe,
  Github,
  Linkedin,
  Clock,
  X,
  FileCheck,
  Star,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { ResumeDocument } from '@shared/types';

interface TemplateOption {
  id: string;
  name: string;
  badge: string;
  description: string;
  accentColor: string;
}

const TEMPLATES: TemplateOption[] = [
  {
    id: 'modern_clean',
    name: 'Modern Minimalist',
    badge: 'Tech Recommended',
    description: 'Clean whitespace, elegant Fraunces header, balanced ATS hierarchy.',
    accentColor: 'text-bridge-teal border-bridge-teal',
  },
  {
    id: 'technical_ats',
    name: 'Technical ATS Dense',
    badge: 'High Density',
    description: 'Monospaced skill tags, rigorous metric bullets, algorithmic layout.',
    accentColor: 'text-indigo-600 border-indigo-600',
  },
  {
    id: 'classic_academic',
    name: 'Classic Academic',
    badge: 'Formal Standard',
    description: 'Traditional serif headers, publication highlights, and course honors.',
    accentColor: 'text-amber-600 border-amber-600',
  },
  {
    id: 'executive_pro',
    name: 'Executive Professional',
    badge: 'Leadership',
    description: 'Executive summary highlight, project milestones, and impact metrics.',
    accentColor: 'text-slate-800 border-slate-800',
  },
  {
    id: 'compact_engineer',
    name: 'Compact 1-Page Engineer',
    badge: 'Fast Scan',
    description: 'Single-page recruiter format optimized for quick 6-second screenings.',
    accentColor: 'text-emerald-600 border-emerald-600',
  },
];

export const CareerResumeBuilder: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const studentProfileId = user?.studentProfile?.id;

  const widgetState = location.state as { interest?: string; location?: string } | undefined;

  // Resumes list loaded from server
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active Dropdown Menu in Resume List
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Creation Option Modal State
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState<boolean>(false);
  const [selectedTemplateForNew, setSelectedTemplateForNew] = useState<string>('modern_clean');
  const [creationMethod, setCreationMethod] = useState<'profile' | 'blank'>('profile');

  // Active Builder State
  const [activeResume, setActiveResume] = useState<ResumeDocument | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [newSkillInput, setNewSkillInput] = useState<string>('');

  // Accordion Section Expansion State
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    skills: true,
    education: false,
    experience: false,
    responsibilities: false,
    projects: false,
    socials: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Upload file ref
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Load user resumes from server
  const loadResumes = async () => {
    if (!studentProfileId) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get<{ resumes: ResumeDocument[] }>('/resumes');
      setResumes(res.resumes || []);
    } catch (err) {
      console.error('Error loading resumes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, [studentProfileId]);

  // If navigated directly with widget state, open creation modal
  useEffect(() => {
    if (widgetState?.interest && !activeResume) {
      setSelectedTemplateForNew('modern_clean');
      setIsChoiceModalOpen(true);
    }
  }, [widgetState]);

  // Debounced auto-save when editing an active resume
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerAutoSave = (updatedResume: ResumeDocument) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.post<{ resume: any }>('/resumes/save', {
          id: updatedResume.id.startsWith('temp-') ? undefined : updatedResume.id,
          title: updatedResume.title,
          templateId: updatedResume.templateId,
          type: updatedResume.type,
          isPrimary: updatedResume.isPrimary,
          content: updatedResume.content,
        });

        if (res.resume) {
          setActiveResume((prev) => (prev ? { ...prev, id: res.resume.id } : null));
          setResumes((prev) =>
            prev.map((r) => (r.id === updatedResume.id ? { ...updatedResume, id: res.resume.id } : r))
          );
        }

        const now = new Date();
        setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        console.error('Auto-save error:', err);
      } finally {
        setIsSaving(false);
      }
    }, 2000);
  };

  const updateContentField = (field: string, value: any) => {
    if (!activeResume) return;

    const updated: ResumeDocument = {
      ...activeResume,
      content: {
        ...activeResume.content,
        [field]: value,
      },
    };

    setActiveResume(updated);
    triggerAutoSave(updated);
  };

  // Step 2: Handle creation confirmation (Fetch From Profile vs Blank)
  const handleConfirmCreation = async () => {
    setIsChoiceModalOpen(false);

    let initialContent: any = {
      fullName: user?.name || '',
      headline: '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: 'India',
      avatarUrl: user?.avatarUrl || '',
      summary: '',
      skills: [],
      educations: [],
      experiences: [],
      responsibilities: [],
      projects: [],
      socials: {
        linkedin: '',
        github: '',
        website: '',
      },
    };

    if (creationMethod === 'profile' && studentProfileId) {
      try {
        const res = await api.post<{ content: any }>('/resumes/generate-content', {
          careerObjective: widgetState?.interest ? `Targeting roles in ${widgetState.interest}` : undefined,
        });
        if (res.content) {
          initialContent = {
            ...initialContent,
            ...res.content,
            fullName: res.content.fullName || user?.name || '',
            email: res.content.email || user?.email || '',
            headline: widgetState?.interest || res.content.headline || 'Software Engineer',
            location: widgetState?.location || res.content.location || 'India',
          };
        }
      } catch (err) {
        console.error('Failed to pre-fill from profile:', err);
      }
    }

    const newDoc: ResumeDocument = {
      id: `temp-${Date.now()}`,
      studentId: studentProfileId || '',
      type: 'BUILT',
      title: widgetState?.interest
        ? `${widgetState.interest.split(' ')[0]} Engineering Resume`
        : `Resume ${resumes.length + 1}`,
      templateId: selectedTemplateForNew,
      fileSize: '180 KB',
      isPrimary: resumes.length === 0,
      content: initialContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setActiveResume(newDoc);
    setResumes((prev) => [newDoc, ...prev]);
    triggerAutoSave(newDoc);
  };

  // Actions for saved resumes in list
  const handleSetPrimary = async (id: string) => {
    try {
      await api.patch(`/resumes/${id}/primary`);
      setResumes((prev) =>
        prev.map((r) => ({
          ...r,
          isPrimary: r.id === id,
        }))
      );
    } catch (err) {
      console.error('Failed to set primary resume:', err);
    }
    setActiveMenuId(null);
  };

  const handleDeleteResume = async (id: string) => {
    if (confirm('Are you sure you want to delete this resume?')) {
      try {
        await api.delete(`/resumes/${id}`);
        setResumes((prev) => prev.filter((r) => r.id !== id));
        if (activeResume?.id === id) {
          setActiveResume(null);
        }
      } catch (err) {
        console.error('Failed to delete resume:', err);
      }
      setActiveMenuId(null);
    }
  };

  const handleDownloadPDF = async (resume: ResumeDocument) => {
    try {
      const blob = await api.post<Blob>('/resumes/export-pdf', {
        content: resume.content,
        template: resume.templateId || 'modern_clean',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${resume.title.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(`Exporting ${resume.title}.pdf...`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.upload<{ resume: any; message: string }>('/resumes/upload', formData);
      if (res.resume) {
        loadResumes();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload resume file.');
    }
  };

  // Helper to add skill chip
  const handleAddSkill = () => {
    if (!newSkillInput.trim() || !activeResume) return;
    const current = activeResume.content.skills || [];
    if (!current.includes(newSkillInput.trim())) {
      updateContentField('skills', [...current, newSkillInput.trim()]);
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (!activeResume) return;
    const current = activeResume.content.skills || [];
    updateContentField('skills', current.filter((s) => s !== skillToRemove));
  };

  return (
    <div className="space-y-8 font-sans">
      {/* ─────────────────────────────────────────────────────────────
          TOP HEADER
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-bridge-border">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-bridge-teal uppercase font-semibold block mb-1">
            [● VERIFIED CAREER ARTIFACTS]
          </span>
          <h1 className="text-xl sm:text-3xl font-bold text-bridge-text tracking-tight">
            {activeResume ? 'Resume Editor & Studio' : 'Resume Builder'}
          </h1>
          <p className="text-xs text-bridge-text-muted mt-0.5">
            {activeResume
              ? 'Edit structured sections on the left; live document preview renders in real time on the right.'
              : 'Craft ATS-optimized, verified engineering resumes powered by platform skill vectors.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeResume ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-mono text-bridge-text-muted">
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin text-bridge-teal" />
                    <span>Saving draft...</span>
                  </>
                ) : lastSavedTime ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-signal-green" />
                    <span>Saved at {lastSavedTime}</span>
                  </>
                ) : null}
              </div>

              <button
                onClick={() => setActiveResume(null)}
                className="px-4 py-2 rounded-xl bg-bridge-panel-raised hover:bg-bridge-panel border border-bridge-border text-bridge-text text-xs font-semibold transition-colors"
              >
                Back to My Resumes
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => uploadInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-bridge-panel hover:bg-bridge-panel-raised border border-bridge-border text-bridge-text text-xs font-semibold transition-colors"
              >
                <Upload className="w-4 h-4 text-bridge-teal" />
                <span>Upload resume</span>
              </button>
              <input
                ref={uploadInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={() => {
                  setSelectedTemplateForNew('modern_clean');
                  setIsChoiceModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bridge-teal hover:bg-bridge-teal-hover text-white text-xs font-semibold shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Resume</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          VIEW A: MY RESUMES LIST & TEMPLATE GALLERY (When not in editor)
      ───────────────────────────────────────────────────────────── */}
      {!activeResume && (
        <div className="space-y-8">
          {/* SECTION 1: TEMPLATE GALLERY */}
          <div className="bg-bridge-panel rounded-2xl border border-bridge-border p-6 shadow-2xs space-y-4">
            <div>
              <span className="text-[10.5px] font-mono tracking-widest text-bridge-teal uppercase font-semibold block mb-1">
                [● INDUSTRY-CALIBRATED ATS TEMPLATES]
              </span>
              <h3 className="text-base font-bold text-bridge-text">
                Choose from a wide variety of templates
              </h3>
              <p className="text-xs text-bridge-text-muted mt-0.5">
                Pick an industry-calibrated format. Click any template to initialize with your verified skill vectors.
              </p>
            </div>

            {/* Template Cards Rail */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
              {/* Distinct "+ Create a new resume" card */}
              <button
                onClick={() => {
                  setSelectedTemplateForNew('modern_clean');
                  setIsChoiceModalOpen(true);
                }}
                className="rounded-2xl border-2 border-dashed border-bridge-teal/40 bg-bridge-teal/5 hover:bg-bridge-teal/10 hover:border-bridge-teal transition-all flex flex-col items-center justify-center p-4 text-center group cursor-pointer aspect-3/4"
              >
                <div className="w-10 h-10 rounded-xl bg-bridge-teal text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform mb-2">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="font-bold text-xs text-bridge-teal">
                  + Create a new resume
                </span>
                <span className="text-[10px] text-bridge-text-muted mt-1 font-mono">Start fresh</span>
              </button>

              {/* Template Options */}
              {TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => {
                    setSelectedTemplateForNew(tmpl.id);
                    setIsChoiceModalOpen(true);
                  }}
                  className="rounded-2xl border border-bridge-border hover:border-bridge-teal/60 p-3.5 bg-bridge-panel-raised hover:bg-bridge-panel transition-all cursor-pointer flex flex-col justify-between aspect-3/4 group"
                >
                  <div className="space-y-2">
                    <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-bridge-panel border border-bridge-border text-bridge-teal block text-center">
                      {tmpl.badge}
                    </span>
                    <h4 className="font-bold text-xs text-bridge-text group-hover:text-bridge-teal transition-colors">
                      {tmpl.name}
                    </h4>
                    <p className="text-[11px] text-bridge-text-muted leading-tight line-clamp-3">
                      {tmpl.description}
                    </p>
                  </div>

                  <button className="w-full py-1.5 rounded-lg bg-bridge-panel group-hover:bg-bridge-teal group-hover:text-white border border-bridge-border text-[11px] font-semibold text-bridge-text transition-colors text-center">
                    Use Template →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: MY RESUMES */}
          <div className="bg-bridge-panel rounded-2xl border border-bridge-border p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-bridge-border">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-bridge-teal" />
                <span className="text-[10.5px] font-mono tracking-widest text-bridge-teal uppercase font-semibold">
                  [● DOCUMENT REPOSITORY]
                </span>
                <h3 className="text-base font-bold text-bridge-text ml-1">My Resumes</h3>
                <span className="px-2 py-0.5 rounded-full bg-bridge-panel-raised border border-bridge-border text-xs font-mono font-bold text-bridge-text-muted">
                  {resumes.length} Document{resumes.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {resumes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-bridge-border text-bridge-text-muted font-mono uppercase text-[11px]">
                      <th className="pb-3 font-semibold">Document Title</th>
                      <th className="pb-3 font-semibold">Format / Type</th>
                      <th className="pb-3 font-semibold">Template</th>
                      <th className="pb-3 font-semibold">Last Updated</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bridge-border">
                    {resumes.map((res) => (
                      <tr key={res.id} className="hover:bg-bridge-panel-raised/50 transition-colors">
                        <td className="py-4 font-semibold text-bridge-text flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-bridge-teal/10 text-bridge-teal flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-2">
                              <span>{res.title}</span>
                              {res.isPrimary && (
                                <span className="px-2 py-0.5 rounded-full bg-signal-green/10 text-signal-green border border-signal-green/30 text-[10px] font-mono font-bold">
                                  Primary
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-bridge-text-muted">
                              {res.fileSize || 'ATS Compliant'}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 font-mono text-bridge-text-muted">
                          <span
                            className={`px-2 py-0.5 rounded text-[10.5px] font-semibold ${
                              res.type === 'UPLOADED'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                                : 'bg-bridge-teal/10 text-bridge-teal border border-bridge-teal/30'
                            }`}
                          >
                            {res.type === 'UPLOADED' ? 'Uploaded' : 'Built'}
                          </span>
                        </td>
                        <td className="py-4 text-bridge-text-muted">
                          {TEMPLATES.find((t) => t.id === res.templateId)?.name || 'Modern Minimalist'}
                        </td>
                        <td className="py-4 font-mono text-bridge-text-muted">
                          {new Date(res.updatedAt || res.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {res.type !== 'UPLOADED' && (
                              <button
                                onClick={() => setActiveResume(res)}
                                className="px-3 py-1.5 rounded-lg bg-bridge-panel-raised hover:bg-bridge-panel border border-bridge-border text-bridge-text font-semibold text-xs flex items-center gap-1 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-bridge-teal" />
                                <span>Edit</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleDownloadPDF(res)}
                              className="p-1.5 rounded-lg text-bridge-text-muted hover:text-bridge-text hover:bg-bridge-panel-raised transition-colors"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleSetPrimary(res.id)}
                              className={`p-1.5 rounded-lg ${
                                res.isPrimary ? 'text-signal-amber' : 'text-bridge-text-muted hover:text-signal-amber'
                              }`}
                              title={res.isPrimary ? 'Primary Resume' : 'Set as Primary'}
                            >
                              <Star className={`w-4 h-4 ${res.isPrimary ? 'fill-signal-amber' : ''}`} />
                            </button>

                            <button
                              onClick={() => handleDeleteResume(res.id)}
                              className="p-1.5 rounded-lg text-bridge-text-muted hover:text-signal-red transition-colors"
                              title="Delete Resume"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* CLEAN EMPTY STATE FOR BRAND NEW ACCOUNTS */
              <div className="p-8 text-center bg-bridge-panel-raised rounded-2xl border border-bridge-border space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-bridge-panel border border-bridge-border text-bridge-teal flex items-center justify-center mx-auto shadow-2xs">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-bridge-text">
                    You haven't created a resume yet
                  </h4>
                  <p className="text-xs text-bridge-text-muted max-w-sm mx-auto">
                    Select a template above to generate an ATS-ready resume pre-filled with your verified skills, or upload an existing file.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedTemplateForNew('modern_clean');
                      setIsChoiceModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-bridge-teal hover:bg-bridge-teal-hover text-white text-xs font-semibold shadow-xs transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Create Your First Resume</span>
                  </button>
                  <button
                    onClick={() => uploadInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-bridge-panel border border-bridge-border text-bridge-text text-xs font-semibold hover:border-bridge-teal transition-colors"
                  >
                    <Upload className="w-4 h-4 text-bridge-teal" />
                    <span>Upload Existing File</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          VIEW B: SPLIT-PANE RESUME BUILDER / EDITOR
      ───────────────────────────────────────────────────────────── */}
      {activeResume && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ═════════════════════════════════════════════════════════════
              LEFT PANE: 7-SECTION VERTICAL ACCORDION
          ═════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-6 space-y-4">
            {/* Document Title Header Card */}
            <div className="bg-bridge-panel rounded-2xl border border-bridge-border p-4 shadow-2xs flex items-center justify-between gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-mono uppercase text-bridge-text-muted block">Resume Document Title</label>
                <input
                  type="text"
                  value={activeResume.title}
                  onChange={(e) => {
                    const updated = { ...activeResume, title: e.target.value };
                    setActiveResume(updated);
                    triggerAutoSave(updated);
                  }}
                  className="font-bold text-base text-bridge-text bg-transparent border-b border-transparent hover:border-bridge-border focus:border-bridge-teal focus:outline-none w-full py-0.5"
                />
              </div>

              <button
                onClick={() => handleDownloadPDF(activeResume)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-bridge-teal hover:bg-bridge-teal-hover text-white font-semibold text-xs transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </div>

            {/* 1. Basic Details Accordion */}
            <div className="bg-bridge-panel rounded-2xl border border-bridge-border shadow-2xs overflow-hidden">
              <button
                onClick={() => toggleSection('basic')}
                className="w-full px-5 py-3.5 flex items-center justify-between bg-bridge-panel-raised hover:bg-bridge-panel/80 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-bridge-teal" />
                  <span className="font-bold text-xs text-bridge-text">1. Basic Details</span>
                </div>
                {expandedSections.basic ? <ChevronUp className="w-4 h-4 text-bridge-text-muted" /> : <ChevronDown className="w-4 h-4 text-bridge-text-muted" />}
              </button>

              {expandedSections.basic && (
                <div className="p-5 space-y-3 text-xs border-t border-bridge-border">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-bridge-text block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={activeResume.content.fullName || ''}
                        onChange={(e) => updateContentField('fullName', e.target.value)}
                        placeholder="e.g. Satyam Singh"
                        className="w-full bg-bridge-panel-raised border border-bridge-border rounded-xl px-3 py-2 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-bridge-text block mb-1">Target Headline</label>
                      <input
                        type="text"
                        value={activeResume.content.headline || ''}
                        onChange={(e) => updateContentField('headline', e.target.value)}
                        placeholder="e.g. Full-Stack Software Engineer"
                        className="w-full bg-bridge-panel-raised border border-bridge-border rounded-xl px-3 py-2 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-bridge-text block mb-1">Email</label>
                      <input
                        type="email"
                        value={activeResume.content.email || ''}
                        onChange={(e) => updateContentField('email', e.target.value)}
                        placeholder="e.g. dev@skillbridge.edu"
                        className="w-full bg-bridge-panel-raised border border-bridge-border rounded-xl px-3 py-2 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-bridge-text block mb-1">Phone</label>
                      <input
                        type="tel"
                        value={activeResume.content.phone || ''}
                        onChange={(e) => updateContentField('phone', e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-bridge-panel-raised border border-bridge-border rounded-xl px-3 py-2 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-bridge-text block mb-1">Location</label>
                      <input
                        type="text"
                        value={activeResume.content.location || ''}
                        onChange={(e) => updateContentField('location', e.target.value)}
                        placeholder="e.g. Bengaluru, India"
                        className="w-full bg-bridge-panel-raised border border-bridge-border rounded-xl px-3 py-2 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-bridge-text block mb-1">Professional Summary</label>
                    <textarea
                      rows={3}
                      value={activeResume.content.summary || ''}
                      onChange={(e) => updateContentField('summary', e.target.value)}
                      placeholder="Write a concise 2-3 sentence overview of your technical background..."
                      className="w-full bg-bridge-panel-raised border border-bridge-border rounded-xl p-3 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal leading-relaxed"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Skills & Expertise Accordion */}
            <div className="bg-bridge-panel rounded-2xl border border-bridge-border shadow-2xs overflow-hidden">
              <button
                onClick={() => toggleSection('skills')}
                className="w-full px-5 py-3.5 flex items-center justify-between bg-bridge-panel-raised hover:bg-bridge-panel/80 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-bridge-teal" />
                  <span className="font-bold text-xs text-bridge-text">2. Skills & Competencies</span>
                  <span className="px-2 py-0.5 rounded-full bg-bridge-panel border border-bridge-border text-[10.5px] font-mono font-bold text-bridge-teal">
                    {(activeResume.content.skills || []).length}
                  </span>
                </div>
                {expandedSections.skills ? <ChevronUp className="w-4 h-4 text-bridge-text-muted" /> : <ChevronDown className="w-4 h-4 text-bridge-text-muted" />}
              </button>

              {expandedSections.skills && (
                <div className="p-5 space-y-3 text-xs border-t border-bridge-border">
                  {/* Skill Tag Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      placeholder="Type a skill (e.g. Docker, TypeScript) and press Enter"
                      className="flex-1 bg-bridge-panel-raised border border-bridge-border rounded-xl px-3 py-2 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-4 py-2 rounded-xl bg-bridge-teal hover:bg-bridge-teal-hover text-white font-semibold text-xs transition-colors"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Skills Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(activeResume.content.skills || []).map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bridge-panel-raised border border-bridge-border text-xs font-mono text-bridge-text"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-bridge-text-muted hover:text-signal-red"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Education Accordion */}
            <div className="bg-bridge-panel rounded-2xl border border-bridge-border shadow-2xs overflow-hidden">
              <button
                onClick={() => toggleSection('education')}
                className="w-full px-5 py-3.5 flex items-center justify-between bg-bridge-panel-raised hover:bg-bridge-panel/80 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-4 h-4 text-bridge-teal" />
                  <span className="font-bold text-xs text-bridge-text">3. Education</span>
                  <span className="px-2 py-0.5 rounded-full bg-bridge-panel border border-bridge-border text-[10.5px] font-mono font-bold text-bridge-teal">
                    {(activeResume.content.educations || []).length}
                  </span>
                </div>
                {expandedSections.education ? <ChevronUp className="w-4 h-4 text-bridge-text-muted" /> : <ChevronDown className="w-4 h-4 text-bridge-text-muted" />}
              </button>

              {expandedSections.education && (
                <div className="p-5 space-y-4 text-xs border-t border-bridge-border">
                  {(activeResume.content.educations || []).map((edu: any, index: number) => (
                    <div key={edu.id || index} className="p-3.5 rounded-xl bg-bridge-panel-raised border border-bridge-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-bridge-text">Education #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (activeResume.content.educations || []).filter((_: any, i: number) => i !== index);
                            updateContentField('educations', updated);
                          }}
                          className="text-bridge-text-muted hover:text-signal-red p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          value={edu.degree || ''}
                          onChange={(e) => {
                            const updated = [...(activeResume.content.educations || [])];
                            updated[index] = { ...updated[index], degree: e.target.value };
                            updateContentField('educations', updated);
                          }}
                          placeholder="Degree (e.g. B.Tech Computer Science)"
                          className="bg-bridge-panel border border-bridge-border rounded-lg px-3 py-1.5 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal"
                        />
                        <input
                          type="text"
                          value={edu.institution || ''}
                          onChange={(e) => {
                            const updated = [...(activeResume.content.educations || [])];
                            updated[index] = { ...updated[index], institution: e.target.value };
                            updateContentField('educations', updated);
                          }}
                          placeholder="Institution (e.g. DTU)"
                          className="bg-bridge-panel border border-bridge-border rounded-lg px-3 py-1.5 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          value={edu.duration || ''}
                          onChange={(e) => {
                            const updated = [...(activeResume.content.educations || [])];
                            updated[index] = { ...updated[index], duration: e.target.value };
                            updateContentField('educations', updated);
                          }}
                          placeholder="Duration (e.g. 2022 - 2026)"
                          className="bg-bridge-panel border border-bridge-border rounded-lg px-3 py-1.5 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal"
                        />
                        <input
                          type="text"
                          value={edu.score || ''}
                          onChange={(e) => {
                            const updated = [...(activeResume.content.educations || [])];
                            updated[index] = { ...updated[index], score: e.target.value };
                            updateContentField('educations', updated);
                          }}
                          placeholder="Score / CGPA (e.g. 8.9/10)"
                          className="bg-bridge-panel border border-bridge-border rounded-lg px-3 py-1.5 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      const newEdu = { id: `edu-${Date.now()}`, degree: '', institution: '', duration: '', score: '' };
                      updateContentField('educations', [...(activeResume.content.educations || []), newEdu]);
                    }}
                    className="w-full py-2 rounded-xl border border-dashed border-bridge-teal/40 hover:border-bridge-teal text-bridge-teal font-semibold text-xs flex items-center justify-center gap-1.5 bg-bridge-teal/5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Education</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. Experience Accordion */}
            <div className="bg-bridge-panel rounded-2xl border border-bridge-border shadow-2xs overflow-hidden">
              <button
                onClick={() => toggleSection('experience')}
                className="w-full px-5 py-3.5 flex items-center justify-between bg-bridge-panel-raised hover:bg-bridge-panel/80 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-bridge-teal" />
                  <span className="font-bold text-xs text-bridge-text">4. Experience</span>
                  <span className="px-2 py-0.5 rounded-full bg-bridge-panel border border-bridge-border text-[10.5px] font-mono font-bold text-bridge-teal">
                    {(activeResume.content.experiences || []).length}
                  </span>
                </div>
                {expandedSections.experience ? <ChevronUp className="w-4 h-4 text-bridge-text-muted" /> : <ChevronDown className="w-4 h-4 text-bridge-text-muted" />}
              </button>

              {expandedSections.experience && (
                <div className="p-5 space-y-4 text-xs border-t border-bridge-border">
                  {(activeResume.content.experiences || []).map((exp: any, index: number) => (
                    <div key={exp.id || index} className="p-3.5 rounded-xl bg-bridge-panel-raised border border-bridge-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-bridge-text">Experience #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (activeResume.content.experiences || []).filter((_: any, i: number) => i !== index);
                            updateContentField('experiences', updated);
                          }}
                          className="text-bridge-text-muted hover:text-signal-red p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          value={exp.title || ''}
                          onChange={(e) => {
                            const updated = [...(activeResume.content.experiences || [])];
                            updated[index] = { ...updated[index], title: e.target.value };
                            updateContentField('experiences', updated);
                          }}
                          placeholder="Role (e.g. Backend Intern)"
                          className="bg-bridge-panel border border-bridge-border rounded-lg px-3 py-1.5 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal"
                        />
                        <input
                          type="text"
                          value={exp.company || ''}
                          onChange={(e) => {
                            const updated = [...(activeResume.content.experiences || [])];
                            updated[index] = { ...updated[index], company: e.target.value };
                            updateContentField('experiences', updated);
                          }}
                          placeholder="Company / Org"
                          className="bg-bridge-panel border border-bridge-border rounded-lg px-3 py-1.5 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          value={exp.duration || ''}
                          onChange={(e) => {
                            const updated = [...(activeResume.content.experiences || [])];
                            updated[index] = { ...updated[index], duration: e.target.value };
                            updateContentField('experiences', updated);
                          }}
                          placeholder="Duration (e.g. May 2025 - Jul 2025)"
                          className="bg-bridge-panel border border-bridge-border rounded-lg px-3 py-1.5 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal"
                        />
                        <input
                          type="text"
                          value={exp.location || ''}
                          onChange={(e) => {
                            const updated = [...(activeResume.content.experiences || [])];
                            updated[index] = { ...updated[index], location: e.target.value };
                            updateContentField('experiences', updated);
                          }}
                          placeholder="Location (e.g. Remote / Bengaluru)"
                          className="bg-bridge-panel border border-bridge-border rounded-lg px-3 py-1.5 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal"
                        />
                      </div>

                      <textarea
                        rows={2}
                        value={exp.description || ''}
                        onChange={(e) => {
                          const updated = [...(activeResume.content.experiences || [])];
                          updated[index] = { ...updated[index], description: e.target.value };
                          updateContentField('experiences', updated);
                        }}
                        placeholder="Bullet description of accomplishments and technologies used..."
                        className="w-full bg-bridge-panel border border-bridge-border rounded-lg p-2 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal"
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      const newExp = { id: `exp-${Date.now()}`, title: '', company: '', duration: '', location: '', description: '' };
                      updateContentField('experiences', [...(activeResume.content.experiences || []), newExp]);
                    }}
                    className="w-full py-2 rounded-xl border border-dashed border-bridge-teal/40 hover:border-bridge-teal text-bridge-teal font-semibold text-xs flex items-center justify-center gap-1.5 bg-bridge-teal/5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Experience</span>
                  </button>
                </div>
              )}
            </div>

            {/* 5. Responsibilities Accordion */}
            <div className="bg-bridge-panel rounded-2xl border border-bridge-border shadow-2xs overflow-hidden">
              <button
                onClick={() => toggleSection('responsibilities')}
                className="w-full px-5 py-3.5 flex items-center justify-between bg-bridge-panel-raised hover:bg-bridge-panel/80 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Star className="w-4 h-4 text-bridge-teal" />
                  <span className="font-bold text-xs text-bridge-text">5. Responsibilities</span>
                  <span className="px-2 py-0.5 rounded-full bg-bridge-panel border border-bridge-border text-[10.5px] font-mono font-bold text-bridge-teal">
                    {(activeResume.content.responsibilities || []).length}
                  </span>
                </div>
                {expandedSections.responsibilities ? <ChevronUp className="w-4 h-4 text-bridge-text-muted" /> : <ChevronDown className="w-4 h-4 text-bridge-text-muted" />}
              </button>

              {expandedSections.responsibilities && (
                <div className="p-5 space-y-4 text-xs border-t border-bridge-border">
                  {(activeResume.content.responsibilities || []).map((resp: any, index: number) => (
                    <div key={resp.id || index} className="p-3 rounded-xl bg-bridge-panel-raised border border-bridge-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-bridge-text">Position #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (activeResume.content.responsibilities || []).filter((_: any, i: number) => i !== index);
                            updateContentField('responsibilities', updated);
                          }}
                          className="text-bridge-text-muted hover:text-signal-red p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={resp.title || ''}
                          onChange={(e) => {
                            const updated = [...(activeResume.content.responsibilities || [])];
                            updated[index] = { ...updated[index], title: e.target.value };
                            updateContentField('responsibilities', updated);
                          }}
                          placeholder="Position (e.g. Lead Organizer)"
                          className="bg-bridge-panel border border-bridge-border rounded-lg px-3 py-1.5 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal"
                        />
                        <input
                          type="text"
                          value={resp.org || ''}
                          onChange={(e) => {
                            const updated = [...(activeResume.content.responsibilities || [])];
                            updated[index] = { ...updated[index], org: e.target.value };
                            updateContentField('responsibilities', updated);
                          }}
                          placeholder="Club / Community"
                          className="bg-bridge-panel border border-bridge-border rounded-lg px-3 py-1.5 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal"
                        />
                      </div>

                      <textarea
                        rows={1}
                        value={resp.description || ''}
                        onChange={(e) => {
                          const updated = [...(activeResume.content.responsibilities || [])];
                          updated[index] = { ...updated[index], description: e.target.value };
                          updateContentField('responsibilities', updated);
                        }}
                        placeholder="Summary of responsibilities..."
                        className="w-full bg-bridge-panel border border-bridge-border rounded-lg p-2 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal"
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      const newResp = { id: `resp-${Date.now()}`, title: '', org: '', description: '' };
                      updateContentField('responsibilities', [...(activeResume.content.responsibilities || []), newResp]);
                    }}
                    className="w-full py-2 rounded-xl border border-dashed border-bridge-teal/40 hover:border-bridge-teal text-bridge-teal font-semibold text-xs flex items-center justify-center gap-1.5 bg-bridge-teal/5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Responsibility</span>
                  </button>
                </div>
              )}
            </div>

            {/* 6. Projects Accordion */}
            <div className="bg-bridge-panel rounded-2xl border border-bridge-border shadow-2xs overflow-hidden">
              <button
                onClick={() => toggleSection('projects')}
                className="w-full px-5 py-3.5 flex items-center justify-between bg-bridge-panel-raised hover:bg-bridge-panel/80 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Code className="w-4 h-4 text-bridge-teal" />
                  <span className="font-bold text-xs text-bridge-text">6. Projects</span>
                  <span className="px-2 py-0.5 rounded-full bg-bridge-panel border border-bridge-border text-[10.5px] font-mono font-bold text-bridge-teal">
                    {(activeResume.content.projects || []).length}
                  </span>
                </div>
                {expandedSections.projects ? <ChevronUp className="w-4 h-4 text-bridge-text-muted" /> : <ChevronDown className="w-4 h-4 text-bridge-text-muted" />}
              </button>

              {expandedSections.projects && (
                <div className="p-5 space-y-4 text-xs border-t border-bridge-border">
                  {(activeResume.content.projects || []).map((proj: any, index: number) => (
                    <div key={proj.id || index} className="p-3.5 rounded-xl bg-bridge-panel-raised border border-bridge-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-bridge-text">Project #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (activeResume.content.projects || []).filter((_: any, i: number) => i !== index);
                            updateContentField('projects', updated);
                          }}
                          className="text-bridge-text-muted hover:text-signal-red p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          value={proj.title || ''}
                          onChange={(e) => {
                            const updated = [...(activeResume.content.projects || [])];
                            updated[index] = { ...updated[index], title: e.target.value };
                            updateContentField('projects', updated);
                          }}
                          placeholder="Project Title"
                          className="bg-bridge-panel border border-bridge-border rounded-lg px-3 py-1.5 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal"
                        />
                        <input
                          type="text"
                          value={Array.isArray(proj.techStack) ? proj.techStack.join(', ') : proj.techStack || ''}
                          onChange={(e) => {
                            const updated = [...(activeResume.content.projects || [])];
                            updated[index] = { ...updated[index], techStack: e.target.value };
                            updateContentField('projects', updated);
                          }}
                          placeholder="Tech Stack (e.g. React, Node, PostgreSQL)"
                          className="bg-bridge-panel border border-bridge-border rounded-lg px-3 py-1.5 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal font-mono"
                        />
                      </div>

                      <textarea
                        rows={2}
                        value={proj.description || ''}
                        onChange={(e) => {
                          const updated = [...(activeResume.content.projects || [])];
                          updated[index] = { ...updated[index], description: e.target.value };
                          updateContentField('projects', updated);
                        }}
                        placeholder="Describe system architecture, problem solved, or outcomes..."
                        className="w-full bg-bridge-panel border border-bridge-border rounded-lg p-2 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal"
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      const newProj = { id: `proj-${Date.now()}`, title: '', techStack: '', description: '', githubUrl: '' };
                      updateContentField('projects', [...(activeResume.content.projects || []), newProj]);
                    }}
                    className="w-full py-2 rounded-xl border border-dashed border-bridge-teal/40 hover:border-bridge-teal text-bridge-teal font-semibold text-xs flex items-center justify-center gap-1.5 bg-bridge-teal/5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Project</span>
                  </button>
                </div>
              )}
            </div>

            {/* 7. Social Links Accordion */}
            <div className="bg-bridge-panel rounded-2xl border border-bridge-border shadow-2xs overflow-hidden">
              <button
                onClick={() => toggleSection('socials')}
                className="w-full px-5 py-3.5 flex items-center justify-between bg-bridge-panel-raised hover:bg-bridge-panel/80 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-bridge-teal" />
                  <span className="font-bold text-xs text-bridge-text">7. Social & Professional Links</span>
                </div>
                {expandedSections.socials ? <ChevronUp className="w-4 h-4 text-bridge-text-muted" /> : <ChevronDown className="w-4 h-4 text-bridge-text-muted" />}
              </button>

              {expandedSections.socials && (
                <div className="p-5 space-y-3 text-xs border-t border-bridge-border">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-bridge-text block mb-1 flex items-center gap-1.5">
                        <Linkedin className="w-3.5 h-3.5 text-blue-500" />
                        <span>LinkedIn Profile URL</span>
                      </label>
                      <input
                        type="url"
                        value={activeResume.content.socials?.linkedin || ''}
                        onChange={(e) => {
                          const updated = { ...activeResume.content.socials, linkedin: e.target.value };
                          updateContentField('socials', updated);
                        }}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full bg-bridge-panel-raised border border-bridge-border rounded-xl px-3 py-2 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-bridge-text block mb-1 flex items-center gap-1.5">
                        <Github className="w-3.5 h-3.5 text-bridge-text" />
                        <span>GitHub Profile URL</span>
                      </label>
                      <input
                        type="url"
                        value={activeResume.content.socials?.github || ''}
                        onChange={(e) => {
                          const updated = { ...activeResume.content.socials, github: e.target.value };
                          updateContentField('socials', updated);
                        }}
                        placeholder="https://github.com/username"
                        className="w-full bg-bridge-panel-raised border border-bridge-border rounded-xl px-3 py-2 text-xs text-bridge-text placeholder:text-bridge-text-muted/50 focus:outline-none focus:border-bridge-teal font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-bridge-text block mb-1 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-bridge-teal" />
                      <span>Portfolio / Personal Website</span>
                    </label>
                    <input
                      type="url"
                      value={activeResume.content.socials?.website || ''}
                      onChange={(e) => {
                        const updated = { ...activeResume.content.socials, website: e.target.value };
                        updateContentField('socials', updated);
                      }}
                      placeholder="https://yourportfolio.dev"
                      className="w-full bg-console-bg border border-console-border rounded-xl px-3 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-none focus:border-bridge-teal font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════
              RIGHT PANE: REAL-TIME LIVE DOCUMENT PREVIEW
          ═════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-20">
            {/* Live Controls Bar */}
            <div className="bg-bridge-panel rounded-2xl border border-bridge-border p-3 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase font-bold text-bridge-text-muted">Template:</span>
                <select
                  value={activeResume.templateId || 'modern_clean'}
                  onChange={(e) => {
                    const updated = { ...activeResume, templateId: e.target.value };
                    setActiveResume(updated);
                    triggerAutoSave(updated);
                  }}
                  className="bg-bridge-panel-raised border border-bridge-border rounded-lg px-2.5 py-1 text-xs font-semibold text-bridge-text focus:outline-none focus:border-bridge-teal"
                >
                  {TEMPLATES.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPDF(activeResume)}
                  className="p-1.5 rounded-lg bg-bridge-panel-raised hover:bg-bridge-panel border border-bridge-border text-bridge-text transition-colors"
                  title="Export PDF Document"
                >
                  <Download className="w-4 h-4 text-bridge-teal" />
                </button>
              </div>
            </div>

            {/* Document Preview Canvas */}
            <div className="bg-white border border-line rounded-2xl p-7 shadow-lg min-h-[620px] font-sans text-xs space-y-4 text-ink">
              {/* Header */}
              <div className="border-b border-line pb-3 space-y-1">
                <h2 className="font-serif text-2xl font-bold text-ink">
                  {activeResume.content.fullName || 'Your Full Name'}
                </h2>
                <div className="text-xs font-medium text-bridge-teal">
                  {activeResume.content.headline || 'Target Engineering Specialization'}
                </div>
                <div className="flex flex-wrap gap-2 text-[10.5px] font-mono text-ink-muted pt-0.5">
                  <span>{activeResume.content.email || 'email@example.com'}</span>
                  <span>•</span>
                  <span>{activeResume.content.phone || '+91 98765 43210'}</span>
                  <span>•</span>
                  <span>{activeResume.content.location || 'Location'}</span>
                </div>
              </div>

              {/* Summary */}
              {activeResume.content.summary ? (
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase font-bold text-bridge-teal tracking-wider block">
                    Summary
                  </span>
                  <p className="text-ink leading-relaxed text-[11.5px]">
                    {activeResume.content.summary}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-paper rounded-xl border border-dashed border-line text-ink-muted text-center text-[11px]">
                  Write a summary in Basic Details to populate this section.
                </div>
              )}

              {/* Skills */}
              {(activeResume.content.skills || []).length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="font-mono text-[10px] uppercase font-bold text-bridge-teal tracking-wider block">
                    Skills & Technologies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(activeResume.content.skills || []).map((sk: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-paper border border-line text-[10.5px] font-mono text-ink"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {(activeResume.content.experiences || []).length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="font-mono text-[10px] uppercase font-bold text-bridge-teal tracking-wider block">
                    Experience
                  </span>
                  <div className="space-y-2 divide-y divide-line">
                    {(activeResume.content.experiences || []).map((exp: any, i: number) => (
                      <div key={i} className="pt-2 first:pt-0 space-y-0.5">
                        <div className="flex justify-between font-bold text-ink">
                          <span>{exp.title || 'Role Title'}</span>
                          <span className="font-mono text-[10.5px] text-ink-muted">{exp.duration}</span>
                        </div>
                        <div className="text-[11px] text-ink-muted font-medium">{exp.company}</div>
                        {exp.description && (
                          <p className="text-[11px] text-ink leading-relaxed pt-0.5">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {(activeResume.content.educations || []).length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="font-mono text-[10px] uppercase font-bold text-bridge-teal tracking-wider block">
                    Education
                  </span>
                  <div className="space-y-1.5">
                    {(activeResume.content.educations || []).map((edu: any, i: number) => (
                      <div key={i} className="flex justify-between items-baseline">
                        <div>
                          <div className="font-bold text-ink">{edu.degree || 'Degree Program'}</div>
                          <div className="text-[11px] text-ink-muted">{edu.institution} {edu.score ? `• ${edu.score}` : ''}</div>
                        </div>
                        <div className="font-mono text-[10.5px] text-ink-muted">{edu.duration}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {(activeResume.content.projects || []).length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="font-mono text-[10px] uppercase font-bold text-bridge-teal tracking-wider block">
                    Key Projects
                  </span>
                  <div className="space-y-2">
                    {(activeResume.content.projects || []).map((proj: any, i: number) => (
                      <div key={i} className="space-y-0.5">
                        <div className="font-bold text-ink">{proj.title || 'Project Name'}</div>
                        {proj.techStack && (
                          <div className="text-[10px] font-mono text-bridge-teal">
                            Stack: {Array.isArray(proj.techStack) ? proj.techStack.join(', ') : proj.techStack}
                          </div>
                        )}
                        {proj.description && (
                          <p className="text-[11px] text-ink leading-relaxed">{proj.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 2: CREATION OPTION MODAL (Fetch from Profile vs Blank)
      ───────────────────────────────────────────────────────────── */}
      {isChoiceModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsChoiceModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-bridge-panel rounded-2xl border border-bridge-border shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-bridge-border flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-bridge-teal uppercase font-semibold block mb-0.5">
                  [● INITIALIZATION VECTOR]
                </span>
                <h3 className="font-bold text-lg text-bridge-text">Choose Creation Option</h3>
                <p className="text-xs text-bridge-text-muted">Select how you want to initialize your resume draft</p>
              </div>
              <button
                type="button"
                onClick={() => setIsChoiceModalOpen(false)}
                aria-label="Close dialog"
                className="p-1 rounded-lg text-bridge-text-muted hover:text-bridge-text hover:bg-bridge-panel-raised transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Option 1: Fetch from Profile */}
              <div
                onClick={() => setCreationMethod('profile')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                  creationMethod === 'profile'
                    ? 'border-bridge-teal bg-bridge-teal/10 shadow-2xs'
                    : 'border-bridge-border hover:border-bridge-teal/50 bg-bridge-panel-raised'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    creationMethod === 'profile'
                      ? 'bg-bridge-teal text-white'
                      : 'bg-bridge-panel border border-bridge-border text-bridge-teal'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-bridge-text">Fetch From Profile</h4>
                    <span className="px-2 py-0.5 rounded-full bg-bridge-teal/20 text-bridge-teal text-[10px] font-mono font-bold">
                      RECOMMENDED
                    </span>
                  </div>
                  <p className="text-xs text-bridge-text-muted leading-relaxed">
                    Auto-populates your resume using your verified SkillBridge profile, skill radar benchmarks, work history, and academic scores.
                  </p>
                </div>
              </div>

              {/* Option 2: Create New Resume (Blank) */}
              <div
                onClick={() => setCreationMethod('blank')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                  creationMethod === 'blank'
                    ? 'border-bridge-teal bg-bridge-teal/10 shadow-2xs'
                    : 'border-bridge-border hover:border-bridge-teal/50 bg-bridge-panel-raised'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    creationMethod === 'blank'
                      ? 'bg-bridge-teal text-white'
                      : 'bg-bridge-panel border border-bridge-border text-bridge-text-muted'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-bridge-text">Create New Resume</h4>
                  <p className="text-xs text-bridge-text-muted leading-relaxed">
                    Opens the builder completely blank so you can enter tailored information from scratch.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-bridge-panel-raised border-t border-bridge-border flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsChoiceModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-bridge-text-muted hover:text-bridge-text hover:bg-bridge-panel transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCreation}
                className="px-6 py-2.5 rounded-xl bg-bridge-teal hover:bg-bridge-teal-hover text-white font-semibold text-xs shadow-xs transition-all"
              >
                Continue to Builder →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
