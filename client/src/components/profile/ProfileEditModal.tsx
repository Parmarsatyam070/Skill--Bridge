import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Sparkles, Building, GraduationCap, Briefcase, Award, Code2, Link as LinkIcon } from 'lucide-react';

export type ModalType =
  | 'edit_profile'
  | 'edit_about'
  | 'add_experience'
  | 'edit_experience'
  | 'add_education'
  | 'edit_education'
  | 'manage_skills'
  | 'add_project'
  | 'edit_project'
  | 'add_certificate'
  | 'add_responsibility'
  | 'add_achievement'
  | 'edit_socials';

interface ProfileEditModalProps {
  isOpen: boolean;
  type: ModalType | null;
  initialData?: any;
  onClose: () => void;
  onSave: (type: ModalType, data: any) => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  type,
  initialData,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<any>({});
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      setFormData({});
    }
  }, [initialData, type, isOpen]);

  if (!isOpen || !type) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(type, formData);
    onClose();
  };

  const getTitle = () => {
    switch (type) {
      case 'edit_profile':
        return 'Edit Basic Profile Details';
      case 'edit_about':
        return 'Edit About Bio';
      case 'add_experience':
        return 'Add Work Experience';
      case 'edit_experience':
        return 'Edit Work Experience';
      case 'add_education':
        return 'Add Education';
      case 'edit_education':
        return 'Edit Education';
      case 'manage_skills':
        return 'Manage Skills Inventory';
      case 'add_project':
      case 'edit_project':
        return type === 'add_project' ? 'Add Featured Project' : 'Edit Project';
      case 'add_certificate':
        return 'Add Professional Certification';
      case 'add_responsibility':
        return 'Add Position of Responsibility';
      case 'add_achievement':
        return 'Add Honors & Achievement';
      case 'edit_socials':
        return 'Edit Professional Social Links';
      default:
        return 'Edit Section';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-console-panel rounded-2xl border border-console-border max-w-lg w-full p-6 shadow-2xl space-y-5 relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-console-border">
          <h3 className="font-serif text-lg font-bold text-console-text">{getTitle()}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-console-muted hover:text-console-text hover:bg-console-bg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          {/* 1. Edit Profile Basic Info */}
          {type === 'edit_profile' && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-console-text mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Satyam Singh"
                  required
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal"
                />
              </div>

              <div>
                <label className="block font-semibold text-console-text mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username || ''}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. satyamsingh"
                  required
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-console-text mb-1">Headline / Role Title</label>
                <input
                  type="text"
                  value={formData.headline || ''}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  placeholder="e.g. Full-Stack Engineer & Machine Learning Enthusiast"
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal"
                />
              </div>

              <div>
                <label className="block font-semibold text-console-text mb-1">University / Current Organization</label>
                <input
                  type="text"
                  value={formData.institution || ''}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  placeholder="e.g. Delhi Technological University"
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal"
                />
              </div>

              <div>
                <label className="block font-semibold text-console-text mb-1">Primary Resume Filename Link</label>
                <input
                  type="text"
                  value={formData.resumeFileName || ''}
                  onChange={(e) => setFormData({ ...formData, resumeFileName: e.target.value })}
                  placeholder="e.g. Satyam Singh-resume.pdf"
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal font-mono"
                />
              </div>
            </div>
          )}

          {/* 2. Edit About Bio */}
          {type === 'edit_about' && (
            <div className="space-y-2">
              <label className="block font-semibold text-console-text">About Bio</label>
              <textarea
                rows={6}
                value={formData.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Write a concise overview of your technical background, projects, academic journey, and aspirations..."
                required
                className="w-full bg-console-bg border border-console-border rounded-xl p-3 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal leading-relaxed"
              />
            </div>
          )}

          {/* 3. Work Experience */}
          {(type === 'add_experience' || type === 'edit_experience') && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-console-text mb-1">Job Title</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Software Engineering Intern"
                  required
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal"
                />
              </div>

              <div>
                <label className="block font-semibold text-console-text mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={formData.company || ''}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g. TechCorp India"
                  required
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal"
                />
              </div>

              <div>
                <label className="block font-semibold text-console-text mb-1">Duration</label>
                <input
                  type="text"
                  value={formData.duration || ''}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g. Jun 2025 - Aug 2025 (3 mos)"
                  required
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-console-text mb-1">Description & Impact</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Engineered high-throughput microservices, optimized SQL queries by 35%..."
                  className="w-full bg-console-bg border border-console-border rounded-xl p-3 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-semibold text-console-text mb-1">Skills Acquired (Comma separated)</label>
                <input
                  type="text"
                  value={Array.isArray(formData.skills) ? formData.skills.join(', ') : formData.skills || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="e.g. React, TypeScript, Docker, PostgreSQL"
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal font-mono"
                />
              </div>
            </div>
          )}

          {/* 4. Education */}
          {(type === 'add_education' || type === 'edit_education') && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-console-text mb-1">Degree & Major</label>
                <input
                  type="text"
                  value={formData.degree || ''}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  placeholder="e.g. B.Tech in Computer Science and Engineering"
                  required
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal"
                />
              </div>

              <div>
                <label className="block font-semibold text-console-text mb-1">Institution Name</label>
                <input
                  type="text"
                  value={formData.institution || ''}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  placeholder="e.g. Delhi Technological University"
                  required
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-console-text mb-1">Duration</label>
                  <input
                    type="text"
                    value={formData.duration || ''}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g. 2023 - 2027"
                    required
                    className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-console-text mb-1">CGPA / Score</label>
                  <input
                    type="text"
                    value={formData.score || ''}
                    onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                    placeholder="e.g. 8.9 / 10.0"
                    required
                    className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-console-text mb-1">Key Focus Courses & Skills</label>
                <input
                  type="text"
                  value={Array.isArray(formData.skills) ? formData.skills.join(', ') : formData.skills || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="e.g. Data Structures & Algorithms, OS, DBMS, Computer Networks"
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal font-mono"
                />
              </div>
            </div>
          )}

          {/* 5. Projects */}
          {(type === 'add_project' || type === 'edit_project') && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-console-text mb-1">Project Title</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. SkillBridge AI Career & Matching Engine"
                  required
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal"
                />
              </div>

              <div>
                <label className="block font-semibold text-console-text mb-1">Description & Architecture</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Architected mathematical vector matching algorithms, React dashboard with Tailwind..."
                  required
                  className="w-full bg-console-bg border border-console-border rounded-xl p-3 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-semibold text-console-text mb-1">Tech Stack (Comma separated)</label>
                <input
                  type="text"
                  value={Array.isArray(formData.techStack) ? formData.techStack.join(', ') : formData.techStack || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      techStack: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="e.g. React, TypeScript, Node.js, Prisma, TailwindCSS"
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-console-text mb-1">Live Demo Link</label>
                  <input
                    type="url"
                    value={formData.demoUrl || ''}
                    onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-console-text mb-1">GitHub Repo Link</label>
                  <input
                    type="url"
                    value={formData.githubUrl || ''}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. Manage Skills */}
          {type === 'manage_skills' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-console-text mb-1.5">Add New Skill Tag</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="e.g. Next.js, GraphQL, Redis, Rust"
                    className="flex-1 bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (skillInput.trim()) {
                        const current = Array.isArray(formData.skills) ? formData.skills : [];
                        if (!current.includes(skillInput.trim())) {
                          setFormData({ ...formData, skills: [...current, skillInput.trim()] });
                        }
                        setSkillInput('');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white font-semibold text-xs flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-console-text mb-2">Current Skill Tags</label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 rounded-xl bg-console-bg border border-console-border">
                  {Array.isArray(formData.skills) &&
                    formData.skills.map((sk: string, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-console-panel border border-console-border text-xs font-mono text-console-text shadow-2xs"
                      >
                        <span>{sk}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              skills: formData.skills.filter((_: any, i: number) => i !== idx),
                            });
                          }}
                          className="text-console-muted hover:text-status-red"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* 7. Certificates */}
          {type === 'add_certificate' && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-console-text mb-1">Certification Title</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. AWS Certified Solutions Architect - Associate"
                  required
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal"
                />
              </div>

              <div>
                <label className="block font-semibold text-console-text mb-1">Issuing Organization</label>
                <input
                  type="text"
                  value={formData.issuer || ''}
                  onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                  placeholder="e.g. Amazon Web Services (AWS) / NPTEL"
                  required
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-console-text mb-1">Issue Date</label>
                  <input
                    type="text"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    placeholder="e.g. July 2025"
                    required
                    className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-console-text mb-1">Credential URL</label>
                  <input
                    type="url"
                    value={formData.url || ''}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 8. Responsibilities & Achievements */}
          {(type === 'add_responsibility' || type === 'add_achievement') && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-console-text mb-1">Title / Role</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={type === 'add_responsibility' ? 'e.g. Lead Organizer - HackDTU 2026' : 'e.g. National Finalist - SIH 2026'}
                  required
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal"
                />
              </div>

              <div>
                <label className="block font-semibold text-console-text mb-1">Organization / Event</label>
                <input
                  type="text"
                  value={formData.org || ''}
                  onChange={(e) => setFormData({ ...formData, org: e.target.value })}
                  placeholder="e.g. Delhi Technological University"
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal"
                />
              </div>

              <div>
                <label className="block font-semibold text-console-text mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Led a 25-member cross-functional committee, managed 1,200+ participants..."
                  className="w-full bg-console-bg border border-console-border rounded-xl p-3 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* 9. Social Links */}
          {type === 'edit_socials' && (
            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block font-semibold font-sans text-console-text mb-1">LinkedIn Profile</label>
                <input
                  type="url"
                  value={formData.linkedin || ''}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal"
                />
              </div>

              <div>
                <label className="block font-semibold font-sans text-console-text mb-1">GitHub Profile</label>
                <input
                  type="url"
                  value={formData.github || ''}
                  onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                  placeholder="https://github.com/username"
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal"
                />
              </div>

              <div>
                <label className="block font-semibold font-sans text-console-text mb-1">X (Twitter)</label>
                <input
                  type="url"
                  value={formData.twitter || ''}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  placeholder="https://x.com/username"
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal"
                />
              </div>

              <div>
                <label className="block font-semibold font-sans text-console-text mb-1">LeetCode / Codeforces</label>
                <input
                  type="url"
                  value={formData.leetcode || ''}
                  onChange={(e) => setFormData({ ...formData, leetcode: e.target.value })}
                  placeholder="https://leetcode.com/username"
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal"
                />
              </div>

              <div>
                <label className="block font-semibold font-sans text-console-text mb-1">Personal Portfolio Website</label>
                <input
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://satyamsingh.dev"
                  className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder-console-muted/50 focus:outline-hidden focus:border-bridge-teal"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-console-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-console-muted hover:text-console-text hover:bg-console-bg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white font-semibold text-xs shadow-xs transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
