import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Download,
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  Save,
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

export const ResumeBuilderPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const studentProfileId = user?.studentProfile?.id;

  const [activeTab, setActiveTab] = useState<'ai_builder' | 'manual_upload'>('ai_builder');
  const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'technical' | 'executive'>('modern');

  // Resume content state
  const [resumeContent, setResumeContent] = useState<any>(null);
  const [resumeTitle, setResumeTitle] = useState('Full-Stack Software Engineering Resume (2026)');
  const [objectiveInput, setObjectiveInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<any | null>(null);

  // 1. Fetch Existing Saved Resumes
  const { data: resumesData } = useQuery({
    queryKey: ['studentResumes', studentProfileId],
    queryFn: () => api.get<{ resumes: any[] }>('/resumes'),
    enabled: !!studentProfileId,
  });

  // Generate AI Content Mutation
  const generateMutation = useMutation({
    mutationFn: (customInput?: any) =>
      api.post('/resumes/generate-content', customInput || {}),
    onSuccess: (res) => {
      setResumeContent(res.content);
      setIsGenerating(false);
    },
  });

  // Save Resume Mutation
  const saveMutation = useMutation({
    mutationFn: (data: { title: string; templateId: string; content: any }) =>
      api.post('/resumes/save', data),
    onSuccess: () => {
      setSaveSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['studentResumes'] });
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  // Initial Content Load
  React.useEffect(() => {
    if (!resumeContent && studentProfileId) {
      generateMutation.mutate();
    }
  }, [studentProfileId]);

  const handleDownloadPdf = async () => {
    if (!resumeContent) return;
    try {
      const blob = await api.post<Blob>('/resumes/export-pdf', {
        content: resumeContent,
        template: selectedTemplate,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${resumeContent.fullName.replace(/\s+/g, '_')}_SkillBridge_Resume.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('PDF export error:', err);
    }
  };

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/resumes/upload', formData);
      setUploadSuccess(res);
      queryClient.invalidateQueries({ queryKey: ['studentResumes'] });
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-console-border">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-console-text-muted block">
            Verified Credential Engine
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-console-text">
            AI Resume Builder & Upload Portal
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-console-panel border border-console-border rounded-xl">
          <button
            onClick={() => setActiveTab('ai_builder')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'ai_builder'
                ? 'bg-bridge-teal text-white font-semibold shadow-sm'
                : 'text-console-text-muted hover:text-console-text'
            }`}
          >
            AI Resume Generator
          </button>
          <button
            onClick={() => setActiveTab('manual_upload')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'manual_upload'
                ? 'bg-bridge-teal text-white font-semibold shadow-sm'
                : 'text-console-text-muted hover:text-console-text'
            }`}
          >
            Upload Existing PDF
          </button>
        </div>
      </div>

      {activeTab === 'ai_builder' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Customization & Bullet Points Editor */}
          <div className="lg:col-span-6 space-y-6">
            {/* Template Selector */}
            <div className="bg-console-panel border border-console-border rounded-2xl p-5 shadow-sm space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-console-text-muted block">
                Choose Output Template
              </span>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'modern', name: 'Modern Clean', badge: 'Tech Recommended' },
                  { id: 'technical', name: 'Technical ATS', badge: 'High Density' },
                  { id: 'executive', name: 'Executive Formal', badge: 'Academic Focus' },
                ].map(tmpl => (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedTemplate === tmpl.id
                        ? 'bg-bridge-teal/15 border-bridge-teal text-console-text shadow-sm'
                        : 'bg-console-panel-raised border-console-border text-console-text-muted hover:border-console-text-muted'
                    }`}
                  >
                    <div className="font-semibold text-xs text-console-text">{tmpl.name}</div>
                    <div className="text-[10px] font-mono text-bridge-teal mt-0.5">{tmpl.badge}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Editable Content Sections */}
            {resumeContent && (
              <div className="bg-console-panel border border-console-border rounded-2xl p-6 shadow-sm space-y-5 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-console-border">
                  <h3 className="font-serif text-base font-bold text-console-text">
                    Resume Content Editor
                  </h3>
                  <button
                    onClick={() => generateMutation.mutate({ careerObjective: objectiveInput })}
                    disabled={generateMutation.isPending}
                    className="flex items-center gap-1.5 text-xs text-bridge-teal hover:underline font-mono"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
                    <span>Regenerate Bullets</span>
                  </button>
                </div>

                {/* Objective / Summary */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-console-text">Professional Summary</label>
                  <textarea
                    rows={3}
                    value={resumeContent.summary}
                    onChange={e => setResumeContent({ ...resumeContent, summary: e.target.value })}
                    className="w-full bg-console-bg border border-console-border rounded-xl p-3 text-xs text-console-text focus:outline-none focus:border-bridge-teal leading-relaxed"
                  />
                </div>

                {/* Verified Skills Preview */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-console-text">Verified Competencies (Auto-Synced)</label>
                    <span className="text-[10px] font-mono text-status-green">✓ Platform Verified</span>
                  </div>
                  <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-console-bg border border-console-border">
                    {resumeContent.verifiedSkills?.map((s: any, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-console-panel border border-console-border font-mono text-[11px] text-bridge-teal">
                        {s.name} ({s.score}%)
                      </span>
                    ))}
                  </div>
                </div>

                {/* Projects Section */}
                <div className="space-y-3">
                  <label className="font-semibold text-console-text">Featured Technical Projects</label>
                  {resumeContent.projects?.map((p: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-console-bg border border-console-border space-y-2">
                      <input
                        type="text"
                        value={p.title}
                        onChange={e => {
                          const updated = [...resumeContent.projects];
                          updated[idx].title = e.target.value;
                          setResumeContent({ ...resumeContent, projects: updated });
                        }}
                        className="w-full bg-console-panel border border-console-border rounded-lg px-2.5 py-1.5 font-bold text-xs text-console-text"
                      />
                      <textarea
                        rows={2}
                        value={p.description}
                        onChange={e => {
                          const updated = [...resumeContent.projects];
                          updated[idx].description = e.target.value;
                          setResumeContent({ ...resumeContent, projects: updated });
                        }}
                        className="w-full bg-console-panel border border-console-border rounded-lg p-2 text-xs text-console-text leading-relaxed"
                      />
                    </div>
                  ))}
                </div>

                {/* Save & Export Actions */}
                <div className="pt-3 border-t border-console-border flex items-center justify-between gap-3">
                  <button
                    onClick={() => saveMutation.mutate({ title: resumeTitle, templateId: selectedTemplate, content: resumeContent })}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-console-panel-raised hover:bg-console-border border border-console-border text-xs font-semibold text-console-text transition-colors"
                  >
                    <Save className="w-4 h-4 text-industry-amber" />
                    <span>{saveSuccess ? '✓ Saved to Profile' : 'Save Version'}</span>
                  </button>

                  <button
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white font-semibold text-xs shadow-sm transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Official PDF</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Document Preview */}
          <div className="lg:col-span-6">
            <div className="sticky top-20 bg-white text-ink rounded-2xl p-8 shadow-2xl border border-line space-y-6 font-sans text-xs">
              {/* Document Header */}
              <div className="border-b border-line pb-4 space-y-1">
                <h2 className="font-serif text-2xl font-bold text-campus-blue">
                  {resumeContent?.fullName || user?.name}
                </h2>
                <div className="text-xs text-ink-muted">
                  {resumeContent?.targetDomain || user?.studentProfile?.targetDomain} • {resumeContent?.institution || user?.studentProfile?.institution}
                </div>
                <div className="text-[11px] font-mono text-ink-muted">
                  Email: {user?.email} • Verified on SkillBridge
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-1.5">
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-campus-blue">
                  Professional Summary
                </div>
                <p className="text-xs text-ink leading-relaxed">
                  {resumeContent?.summary}
                </p>
              </div>

              {/* Verified Competencies */}
              <div className="space-y-1.5">
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-campus-blue">
                  Verified Technical Competencies
                </div>
                <div className="text-xs font-mono font-semibold text-bridge-teal leading-relaxed">
                  {resumeContent?.verifiedSkills?.map((s: any) => `${s.name} (${s.score}%)`).join('  •  ')}
                </div>
              </div>

              {/* Projects */}
              <div className="space-y-3">
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-campus-blue">
                  Key Technical Projects
                </div>
                {resumeContent?.projects?.map((p: any, i: number) => (
                  <div key={i} className="space-y-1">
                    <div className="font-bold text-xs text-ink">{p.title}</div>
                    <div className="text-[11px] font-mono text-ink-muted">Tech Stack: {p.techStack}</div>
                    <p className="text-xs text-ink leading-relaxed">{p.description}</p>
                  </div>
                ))}
              </div>

              {/* Verified Partner Courses */}
              {resumeContent?.completedCourses && resumeContent.completedCourses.length > 0 && (
                <div className="space-y-2">
                  <div className="font-mono text-xs font-bold uppercase tracking-wider text-campus-blue">
                    Accredited Learning & Certifications
                  </div>
                  {resumeContent.completedCourses.map((c: any, i: number) => (
                    <div key={i} className="text-xs">
                      <span className="font-semibold text-ink">• {c.title}</span>{' '}
                      <span className="font-mono text-ink-muted">({c.provider} - Verified)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Manual Upload View */
        <div className="max-w-2xl mx-auto bg-console-panel border border-console-border rounded-2xl p-8 space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-bridge-teal/15 text-bridge-teal flex items-center justify-center mx-auto border border-bridge-teal/30">
            <Upload className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="font-serif text-xl font-bold text-console-text">
              Upload Existing Resume File
            </h3>
            <p className="text-xs text-console-text-muted max-w-md mx-auto">
              Upload your PDF or DOCX resume. Our parser will extract keywords to suggest matching skill tags for your radar.
            </p>
          </div>

          <div className="border-2 border-dashed border-console-border rounded-2xl p-8 hover:border-bridge-teal transition-colors">
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleManualUpload}
              id="resume-file-input"
              className="hidden"
            />
            <label
              htmlFor="resume-file-input"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <FileText className="w-8 h-8 text-console-text-muted" />
              <span className="text-xs font-semibold text-bridge-teal hover:underline">
                Click to browse or drag and drop your file
              </span>
              <span className="text-[11px] font-mono text-console-text-muted">
                Supported formats: PDF, DOCX (Max 10MB)
              </span>
            </label>
          </div>

          {uploadSuccess && (
            <div className="p-4 rounded-xl bg-status-green/15 border border-status-green/30 text-status-green text-xs text-left space-y-2">
              <div className="font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Resume Uploaded Successfully: {uploadSuccess.resume.title}</span>
              </div>
              {uploadSuccess.skillSuggestions && (
                <div className="text-console-text pt-2 border-t border-status-green/20">
                  <div className="text-[11px] font-mono text-console-text-muted mb-1">
                    Detected Skills Suggested for Assessment:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {uploadSuccess.skillSuggestions.suggestedSkills.map((s: any) => (
                      <span key={s.skillId} className="px-2 py-0.5 rounded bg-console-panel border border-console-border font-mono text-[10.5px] text-bridge-teal">
                        + {s.skillName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
