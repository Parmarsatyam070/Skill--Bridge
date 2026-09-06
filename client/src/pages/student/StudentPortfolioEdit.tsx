import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  User,
  Github,
  Linkedin,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

export const StudentPortfolioEdit: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const studentProfileId = user?.studentProfile?.id;

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.studentProfile?.bio || '');
  const [cgpa, setCgpa] = useState(user?.studentProfile?.cgpa || 8.5);
  const [githubUsername, setGithubUsername] = useState(user?.studentProfile?.githubUsername || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user?.studentProfile?.linkedinUrl || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['studentProfile', studentProfileId],
    queryFn: () => api.get<{ student: any }>(`/students/${studentProfileId}`),
    enabled: !!studentProfileId,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => api.put(`/students/${studentProfileId}`, payload),
    onSuccess: async () => {
      setSaveSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
      await refreshUser();
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleConnectGithub = async () => {
    try {
      await api.post('/auth/oauth/connect', { platform: 'GITHUB', username: githubUsername || 'octocat-dev' });
      setGithubConnected(true);
      setTimeout(() => setGithubConnected(false), 4000);
    } catch (err) {
      console.error('GitHub connect error:', err);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name,
      bio,
      cgpa: Number(cgpa),
      githubUsername,
      linkedinUrl,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-console-border">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-console-text-muted block">
            Digital Identity Management
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-console-text">
            Student Portfolio & Integrations
          </h1>
        </div>

        {studentProfileId && (
          <Link
            to={`/portfolio/${studentProfileId}`}
            target="_blank"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <span>Preview Public View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-status-green/15 border border-status-green/30 text-status-green text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Profile and portfolio preferences updated successfully!</span>
        </div>
      )}

      {githubConnected && (
        <div className="p-4 rounded-xl bg-campus-blue/20 border border-campus-blue/40 text-console-text text-xs flex items-center gap-2">
          <Github className="w-4 h-4 text-bridge-teal" />
          <span>GitHub repositories and language tags synced with verified portfolio!</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-console-panel border border-console-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm text-xs">
        <div className="space-y-4">
          <h3 className="font-serif text-base font-bold text-console-text border-b border-console-border pb-2">
            Personal & Academic Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-console-text mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2.5 text-xs text-console-text focus:outline-none focus:border-bridge-teal"
              />
            </div>

            <div>
              <label className="block font-semibold text-console-text mb-1.5">Academic CGPA (Out of 10)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={cgpa}
                onChange={e => setCgpa(Number(e.target.value))}
                className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2.5 text-xs text-console-text focus:outline-none focus:border-bridge-teal font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-console-text mb-1.5">Professional Bio & Aspirations</label>
            <textarea
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Describe your engineering focus, project milestones, and career interests..."
              className="w-full bg-console-bg border border-console-border rounded-xl p-3 text-xs text-console-text focus:outline-none focus:border-bridge-teal leading-relaxed"
            />
          </div>
        </div>

        {/* Platform Integrations */}
        <div className="space-y-4 pt-4 border-t border-console-border">
          <h3 className="font-serif text-base font-bold text-console-text border-b border-console-border pb-2">
            Developer & Social Integrations
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block font-semibold text-console-text">GitHub Username</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={githubUsername}
                  onChange={e => setGithubUsername(e.target.value)}
                  placeholder="e.g. octocat-dev"
                  className="flex-1 bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text focus:outline-none focus:border-bridge-teal font-mono"
                />
                <button
                  type="button"
                  onClick={handleConnectGithub}
                  className="px-3 py-2 rounded-xl bg-console-panel-raised hover:bg-console-border border border-console-border text-console-text text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>Sync</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-semibold text-console-text">LinkedIn Profile URL</label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={e => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text focus:outline-none focus:border-bridge-teal font-mono"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-console-border flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{updateMutation.isPending ? 'Saving Changes...' : 'Save Portfolio Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
