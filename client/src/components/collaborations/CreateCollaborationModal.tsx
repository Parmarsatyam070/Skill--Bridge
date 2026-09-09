import React, { useState } from 'react';
import { useCreateCollaboration, useCollaborationPartners } from '../../hooks/useCollaborations';
import type { CollaborationType, CollaborationDetailDto } from '@shared/types';
import {
  X,
  Plus,
  Loader2,
  AlertCircle,
  Building2,
  GraduationCap,
  Sparkles,
  Tag,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole?: string;
  onCreated?: (collab: CollaborationDetailDto) => void;
}

const COLLAB_TYPES: Array<{ id: CollaborationType; label: string; desc: string }> = [
  { id: 'WORKSHOP', label: 'Technical Workshop', desc: 'Hands-on practical training conducted by industry practitioners' },
  { id: 'HACKATHON', label: 'Campus Hackathon', desc: 'Innovation challenge sponsored by corporate partner' },
  { id: 'MENTORSHIP', label: 'Mentorship Program', desc: '1-on-1 industry engineering mentorship for high-potential students' },
  { id: 'CURRICULUM', label: 'Curriculum Advisory', desc: 'Syllabus gap analysis and modern tech stack integration' },
  { id: 'RESEARCH', label: 'Joint R&D Project', desc: 'Faculty-student research on real-world industrial problems' },
  { id: 'PLACEMENT_DRIVE', label: 'Placement / Hiring Drive', desc: 'Exclusive talent assessment & hiring pipeline' },
];

export const CreateCollaborationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUserRole,
  onCreated,
}) => {
  const [type, setType] = useState<CollaborationType>('WORKSHOP');
  const [partnerId, setPartnerId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDepartment, setTargetDepartment] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: partners, isLoading: isLoadingPartners } = useCollaborationPartners();
  const createMutation = useCreateCollaboration();

  if (!isOpen) return null;

  const isIndustry = currentUserRole === 'INDUSTRY';
  const isInstitution = currentUserRole === 'INSTITUTION_ADMIN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!partnerId) {
      setErrorMsg(isIndustry ? 'Please select a partner institution.' : 'Please select a partner company.');
      return;
    }
    if (title.trim().length < 3) {
      setErrorMsg('Title must be at least 3 characters.');
      return;
    }
    if (description.trim().length < 10) {
      setErrorMsg('Description must be at least 10 characters.');
      return;
    }

    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      const result = await createMutation.mutateAsync({
        type,
        title: title.trim(),
        description: description.trim(),
        targetDepartment: targetDepartment.trim() || undefined,
        proposedDate: proposedDate.trim() || undefined,
        skills: skills.length > 0 ? skills : undefined,
        institutionId: isIndustry ? partnerId : undefined,
        companyId: isInstitution ? partnerId : undefined,
      });

      onClose();
      if (onCreated && result) {
        onCreated(result);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create collaboration proposal.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-collab-title"
    >
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl w-full max-w-2xl my-8 p-6 shadow-2xl space-y-5 text-left">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/15 flex items-center justify-center text-blue-400 border border-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 id="create-collab-title" className="text-lg font-bold text-white">
                New Collaboration Proposal
              </h2>
              <p className="text-xs text-slate-400">
                Propose an academia-industry initiative with verified milestones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#0f172a] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Partner Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              {isIndustry ? (
                <>
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Target Academic Institution *</span>
                </>
              ) : (
                <>
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Target Industry Partner *</span>
                </>
              )}
            </label>

            {isLoadingPartners ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                <span>Loading available partners...</span>
              </div>
            ) : (
              <select
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                required
                className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">
                  {isIndustry ? 'Select an institution...' : 'Select a corporate partner...'}
                </option>
                {isIndustry &&
                  partners?.institutions.map((inst) => (
                    <option key={inst.id} value={inst.id} className="bg-[#0b1329] text-white">
                      {inst.institutionName}{inst.adminDesignation ? ` (${inst.adminDesignation})` : ''}
                    </option>
                  ))}
                {isInstitution &&
                  partners?.companies.map((comp) => (
                    <option key={comp.id} value={comp.id} className="bg-[#0b1329] text-white">
                      {comp.companyName}{comp.industrySector ? ` — ${comp.industrySector}` : ''}
                    </option>
                  ))}
              </select>
            )}
          </div>

          {/* Collaboration Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Collaboration Model *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COLLAB_TYPES.map((t) => {
                const isSelected = type === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setType(t.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500 font-semibold'
                        : 'bg-[#0f172a] border-[#1e293b] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-semibold block">{t.label}</span>
                    <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {t.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Cloud Systems Workshop 2026"
              required
              minLength={3}
              maxLength={200}
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Scope & Objectives *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the curriculum, expected outcomes, prerequisite student profiles, and deliverables..."
              required
              minLength={10}
              maxLength={5000}
              rows={4}
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Department & Timeline in two columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Department
              </label>
              <input
                type="text"
                value={targetDepartment}
                onChange={(e) => setTargetDepartment(e.target.value)}
                placeholder="e.g. Computer Science & Engineering"
                className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Proposed Timeline
              </label>
              <input
                type="text"
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                placeholder="e.g. Q4 2026 or Nov 15 - 20"
                className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Skills tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              <span>Target Technologies / Skills (Comma-separated)</span>
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g. Docker, Kubernetes, Go, PostgreSQL"
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-[#0f172a] border border-[#1e293b] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white flex items-center gap-2 transition-colors disabled:opacity-50 shadow-md shadow-blue-500/20"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Send Proposal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
