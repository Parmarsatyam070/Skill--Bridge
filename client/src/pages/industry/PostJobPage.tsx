import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../lib/api';

export const PostJobPage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stipend, setStipend] = useState('₹35,000 / month');
  const [location, setLocation] = useState('Bengaluru, Karnataka');
  const [workMode, setWorkMode] = useState<'REMOTE' | 'HYBRID' | 'ON_SITE'>('HYBRID');
  const [error, setError] = useState<string | null>(null);

  // Required skills state
  const [selectedSkills, setSelectedSkills] = useState<
    { skillId: string; weight: number; minScore: number }[]
  >([
    { skillId: 'skill-react', weight: 5, minScore: 75 },
    { skillId: 'skill-ts', weight: 4, minScore: 70 },
  ]);

  // Fetch available skills
  const { data: profileData } = useQuery({
    queryKey: ['sampleSkills'],
    queryFn: () => api.get<{ student: any }>('/students/student@skillbridge.edu'),
  });

  const availableSkills = [
    { id: 'skill-react', name: 'React.js' },
    { id: 'skill-ts', name: 'TypeScript' },
    { id: 'skill-node', name: 'Node.js & Express' },
    { id: 'skill-sql', name: 'PostgreSQL & SQL' },
    { id: 'skill-graphql', name: 'GraphQL & APIs' },
    { id: 'skill-python', name: 'Python for Data Science' },
    { id: 'skill-ml', name: 'Machine Learning' },
    { id: 'skill-pytorch', name: 'Deep Learning & PyTorch' },
    { id: 'skill-docker', name: 'Docker & Containers' },
    { id: 'skill-k8s', name: 'Kubernetes Orchestration' },
    { id: 'skill-aws', name: 'AWS Cloud Architecture' },
    { id: 'skill-figma', name: 'Figma & Prototyping' },
    { id: 'skill-design-systems', name: 'Design Systems & Tokens' },
    { id: 'skill-embedded-c', name: 'Embedded C & C++' },
    { id: 'skill-rtos', name: 'FreeRTOS & Concurrency' },
    { id: 'skill-problem-solving', name: 'Problem Solving & DSA' },
    { id: 'skill-communication', name: 'Technical Communication' },
  ];

  const postMutation = useMutation({
    mutationFn: (data: any) => api.post('/internships', data),
    onSuccess: () => {
      navigate('/industry/dashboard');
    },
    onError: (err: any) => {
      setError(err.message || 'Could not post internship.');
    },
  });

  const handleAddSkill = () => {
    const unselected = availableSkills.find(s => !selectedSkills.some(ss => ss.skillId === s.id));
    if (unselected) {
      setSelectedSkills(prev => [...prev, { skillId: unselected.id, weight: 3, minScore: 70 }]);
    }
  };

  const handleRemoveSkill = (index: number) => {
    setSelectedSkills(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSkills.length === 0) {
      setError('Please configure at least one required skill.');
      return;
    }

    setError(null);
    postMutation.mutate({
      title,
      description,
      requiredSkills: selectedSkills,
      stipend,
      location,
      workMode,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 font-sans">
      <div className="pb-4 border-b border-console-border">
        <span className="text-xs font-mono uppercase tracking-wider text-console-text-muted block">
          Requisition Builder
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-console-text">
          Post Internship with Skill Vector Weights
        </h1>
        <p className="text-xs text-console-text-muted mt-1">
          Define target competency thresholds and weights. The matching engine will rank pre-assessed candidates automatically.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-status-red/10 border border-status-red/20 text-status-red text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-console-panel border border-console-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm text-xs">
        <div className="space-y-4">
          <h3 className="font-serif text-base font-bold text-console-text border-b border-console-border pb-2">
            Position Details
          </h3>

          <div>
            <label className="block font-semibold text-console-text mb-1.5">Internship Job Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Full-Stack Software Engineering Intern"
              required
              className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2.5 text-xs text-console-text focus:outline-none focus:border-bridge-teal font-sans"
            />
          </div>

          <div>
            <label className="block font-semibold text-console-text mb-1.5">Role Description & Responsibilities</label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe squad mission, tech stack, and key project outcomes..."
              required
              className="w-full bg-console-bg border border-console-border rounded-xl p-3 text-xs text-console-text focus:outline-none focus:border-bridge-teal leading-relaxed font-sans"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-console-text mb-1.5">Monthly Stipend</label>
              <input
                type="text"
                value={stipend}
                onChange={e => setStipend(e.target.value)}
                placeholder="e.g. ₹35,000 / month"
                required
                className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2.5 text-xs text-console-text focus:outline-none focus:border-bridge-teal font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-console-text mb-1.5">Location</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Bengaluru, Karnataka"
                required
                className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2.5 text-xs text-console-text focus:outline-none focus:border-bridge-teal font-sans"
              />
            </div>

            <div>
              <label className="block font-semibold text-console-text mb-1.5">Work Mode</label>
              <select
                value={workMode}
                onChange={e => setWorkMode(e.target.value as any)}
                className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2.5 text-xs text-console-text focus:outline-none focus:border-bridge-teal font-mono"
              >
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ON_SITE">On-Site</option>
              </select>
            </div>
          </div>
        </div>

        {/* Required Skill Vector Configuration */}
        <div className="space-y-4 pt-4 border-t border-console-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-base font-bold text-console-text">
                Required Skill Vectors & Weights
              </h3>
              <p className="text-[11px] text-console-text-muted">
                Assign weights (1–5x) and minimum target score (0–100%) for mathematical match calculation.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddSkill}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-console-panel-raised hover:bg-console-border border border-console-border text-xs font-semibold text-bridge-teal transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Skill</span>
            </button>
          </div>

          <div className="space-y-3">
            {selectedSkills.map((sk, index) => {
              return (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-console-bg border border-console-border grid grid-cols-1 sm:grid-cols-12 gap-4 items-center"
                >
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-mono text-console-text-muted mb-1">Select Skill</label>
                    <select
                      value={sk.skillId}
                      onChange={e => {
                        const updated = [...selectedSkills];
                        updated[index].skillId = e.target.value;
                        setSelectedSkills(updated);
                      }}
                      className="w-full bg-console-panel border border-console-border rounded-lg px-2.5 py-1.5 text-xs text-console-text focus:outline-none focus:border-bridge-teal font-medium"
                    >
                      {availableSkills.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-mono text-console-text-muted mb-1">
                      Weight: <span className="text-industry-amber font-bold">{sk.weight}x</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={sk.weight}
                      onChange={e => {
                        const updated = [...selectedSkills];
                        updated[index].weight = Number(e.target.value);
                        setSelectedSkills(updated);
                      }}
                      aria-label={`${availableSkills.find(s => s.id === sk.skillId)?.name || 'Skill'} weight: ${sk.weight}x`}
                      className="w-full accent-industry-amber cursor-pointer"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-mono text-console-text-muted mb-1">
                      Target Score: <span className="text-bridge-teal font-bold">{sk.minScore}%</span>
                    </label>
                    <input
                      type="range"
                      min="40"
                      max="95"
                      value={sk.minScore}
                      onChange={e => {
                        const updated = [...selectedSkills];
                        updated[index].minScore = Number(e.target.value);
                        setSelectedSkills(updated);
                      }}
                      aria-label={`${availableSkills.find(s => s.id === sk.skillId)?.name || 'Skill'} target score: ${sk.minScore}%`}
                      className="w-full accent-bridge-teal cursor-pointer"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(index)}
                      className="p-1.5 rounded-lg text-console-text-muted hover:text-status-red hover:bg-console-panel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-console-border flex justify-end">
          <button
            type="submit"
            disabled={postMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-industry-amber hover:bg-industry-amber/90 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
          >
            <span>{postMutation.isPending ? 'Publishing Post...' : 'Publish Internship Requirement'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
