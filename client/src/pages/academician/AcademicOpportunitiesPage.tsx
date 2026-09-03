import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Plus,
  ArrowRight,
  Sparkles,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../lib/api';

export const AcademicOpportunitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [type, setType] = useState<'fdp' | 'research' | 'industrial_training'>('fdp');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState<string | null>(null);

  const postMutation = useMutation({
    mutationFn: (data: any) => api.post('/academic-opportunities', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicOps'] });
      navigate('/academician/dashboard');
    },
    onError: (err: any) => {
      setError(err.message || 'Could not post opportunity.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      setError('Please fill in all required fields.');
      return;
    }

    setError(null);
    postMutation.mutate({ type, title, description, deadline });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 font-sans">
      <div className="pb-4 border-b border-console-border">
        <span className="text-xs font-mono uppercase tracking-wider text-console-text-muted block">
          Collaboration Builder
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-console-text">
          Post Academic-Industry Initiative
        </h1>
        <p className="text-xs text-console-text-muted mt-1">
          Publish Faculty Development Programs (FDPs), industry immersion proposals, or joint research grant topics.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-status-red/10 border border-status-red/20 text-status-red text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-console-panel border border-console-border rounded-2xl p-6 sm:p-8 space-y-5 text-xs shadow-sm">
        <div>
          <label className="block font-semibold text-console-text mb-1.5">Initiative Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as any)}
            className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2.5 text-xs text-console-text focus:outline-none focus:border-bridge-teal font-mono"
          >
            <option value="fdp">Faculty Development Program (FDP)</option>
            <option value="research">Joint Industry-Academia Research Grant</option>
            <option value="industrial_training">Industrial Sabbatical & Faculty Residency</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-console-text mb-1.5">Program / Research Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Modernizing Web & Mobile Engineering Curriculum with Industry Frameworks"
            required
            className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2.5 text-xs text-console-text focus:outline-none focus:border-bridge-teal"
          />
        </div>

        <div>
          <label className="block font-semibold text-console-text mb-1.5">Detailed Scope & Objectives</label>
          <textarea
            rows={5}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe session topics, hands-on lab requirements, eligibility, and expected deliverables..."
            required
            className="w-full bg-console-bg border border-console-border rounded-xl p-3 text-xs text-console-text focus:outline-none focus:border-bridge-teal leading-relaxed"
          />
        </div>

        <div>
          <label className="block font-semibold text-console-text mb-1.5">Application Deadline (Optional)</label>
          <input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2.5 text-xs text-console-text focus:outline-none focus:border-bridge-teal font-mono"
          />
        </div>

        <div className="pt-4 border-t border-console-border flex justify-end">
          <button
            type="submit"
            disabled={postMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-campus-blue hover:bg-campus-blue/90 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
          >
            <span>{postMutation.isPending ? 'Publishing Initiative...' : 'Publish Program Proposal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
