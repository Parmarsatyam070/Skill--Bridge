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
      <div className="bg-[#111318] border border-[#2A2E38] rounded-2xl w-full max-w-2xl my-8 p-6 shadow-2xl space-y-5 text-left">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2A2E38]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2F8C82]/15 flex items-center justify-center text-[#2F8C82]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 id="create-collab-title" className="text-lg font-bold text-[#F4F5F7]">
                New Collaboration Proposal
              </h2>
              <p className="text-xs text-[#8B90A0]">
                Propose an academia-industry initiative with verified milestones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-[#1A1D24] transition-colors"
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
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              {isIndustry ? (
                <>
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
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
              <div className="flex items-center gap-2 text-xs text-zinc-500 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2F8C82]" />
                <span>Loading available partners...</span>
              </div>
            ) : (
              <select
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                required
                className="w-full bg-[#1A1D24] border border-[#2A2E38] rounded-xl px-3.5 py-2.5 text-sm text-[#F4F5F7] focus:outline-none focus:border-[#2F8C82] focus:ring-1 focus:ring-[#2F8C82]"
              >
                <option value="">
                  {isIndustry ? 'Select an institution...' : 'Select a corporate partner...'}
                </option>
                {isIndustry &&
                  partners?.institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.institutionName}{inst.adminDesignation ? ` (${inst.adminDesignation})` : ''}
                    </option>
                  ))}
                {isInstitution &&
                  partners?.companies.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.companyName}{comp.industrySector ? ` — ${comp.industrySector}` : ''}
                    </option>
                  ))}
              </select>
            )}
          </div>

          {/* Collaboration Type */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
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
                        ? 'bg-[#2F8C82]/15 border-[#2F8C82] text-white ring-1 ring-[#2F8C82]'
                        : 'bg-[#1A1D24] border-[#2A2E38] text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                    }`}
                  >
                    <span className="text-xs font-semibold block">{t.label}</span>
                    <span className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">
                      {t.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
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
              className="w-full bg-[#1A1D24] border border-[#2A2E38] rounded-xl px-3.5 py-2.5 text-sm text-[#F4F5F7] placeholder-[#8B90A0] focus:outline-none focus:border-[#2F8C82] focus:ring-1 focus:ring-[#2F8C82]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
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
              className="w-full bg-[#1A1D24] border border-[#2A2E38] rounded-xl px-3.5 py-2.5 text-sm text-[#F4F5F7] placeholder-[#8B90A0] focus:outline-none focus:border-[#2F8C82] focus:ring-1 focus:ring-[#2F8C82] resize-none"
            />
          </div>

          {/* Department & Timeline in two columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Target Department
              </label>
              <input
                type="text"
                value={targetDepartment}
                onChange={(e) => setTargetDepartment(e.target.value)}
                placeholder="e.g. Computer Science & Engineering"
                className="w-full bg-[#1A1D24] border border-[#2A2E38] rounded-xl px-3.5 py-2 text-sm text-[#F4F5F7] placeholder-[#8B90A0] focus:outline-none focus:border-[#2F8C82]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Proposed Timeline
              </label>
              <input
                type="text"
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                placeholder="e.g. Q4 2026 or Nov 15 - 20"
                className="w-full bg-[#1A1D24] border border-[#2A2E38] rounded-xl px-3.5 py-2 text-sm text-[#F4F5F7] placeholder-[#8B90A0] focus:outline-none focus:border-[#2F8C82]"
              />
            </div>
          </div>

          {/* Skills tags */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#2F8C82]" />
              <span>Target Technologies / Skills (Comma-separated)</span>
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g. Docker, Kubernetes, Go, PostgreSQL"
              className="w-full bg-[#1A1D24] border border-[#2A2E38] rounded-xl px-3.5 py-2 text-sm text-[#F4F5F7] placeholder-[#8B90A0] focus:outline-none focus:border-[#2F8C82]"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#2A2E38]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#2F8C82] hover:bg-[#3aa398] text-white flex items-center gap-2 transition-colors disabled:opacity-50 shadow-md shadow-[#2F8C82]/20"
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
