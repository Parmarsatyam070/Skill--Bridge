import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Video,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { InterviewDetails } from '@shared/types';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: {
    id: string;
    studentName: string;
    internshipTitle?: string;
    interviewDetails?: InterviewDetails | null;
  } | null;
  jobId?: string;
  onSuccess?: () => void;
}

export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  isOpen,
  onClose,
  application,
  jobId,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  // Tomorrow as default date YYYY-MM-DD
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [roundTitle, setRoundTitle] = useState('Round 1: Technical & DSA Screen');
  const [roundType, setRoundType] = useState<InterviewDetails['roundType']>('technical');
  const [interviewDate, setInterviewDate] = useState(defaultDate);
  const [interviewTime, setInterviewTime] = useState('11:00 AM IST');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/new');
  const [interviewerNotes, setInterviewerNotes] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (application?.interviewDetails) {
      setRoundTitle(application.interviewDetails.roundTitle || 'Round 1: Technical & DSA Screen');
      setRoundType(application.interviewDetails.roundType || 'technical');
      setInterviewDate(application.interviewDetails.interviewDate || defaultDate);
      setInterviewTime(application.interviewDetails.interviewTime || '11:00 AM IST');
      setMeetingLink(application.interviewDetails.meetingLink || 'https://meet.google.com/new');
      setInterviewerNotes(application.interviewDetails.interviewerNotes || '');
    } else {
      setRoundTitle('Round 1: Technical & DSA Screen');
      setRoundType('technical');
      setInterviewDate(defaultDate);
      setInterviewTime('11:00 AM IST');
      setMeetingLink('https://meet.google.com/new');
      setInterviewerNotes('');
    }
    setValidationError('');
  }, [application, isOpen]);

  const scheduleMutation = useMutation({
    mutationFn: (data: { appId: string; payload: any }) =>
      api.put(`/applications/${data.appId}/status`, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplicants', jobId] });
      queryClient.invalidateQueries({ queryKey: ['studentApplications'] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setValidationError(err?.response?.data?.error?.message || 'Failed to schedule interview.');
    },
  });

  if (!isOpen || !application) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!interviewDate) {
      setValidationError('Please select an interview date.');
      return;
    }
    if (!interviewTime.trim()) {
      setValidationError('Please specify the interview time.');
      return;
    }

    const payload = {
      status: 'interview',
      interviewDetails: {
        roundTitle: roundTitle.trim() || 'Technical Interview',
        roundType,
        interviewDate,
        interviewTime: interviewTime.trim(),
        meetingLink: meetingLink.trim() || undefined,
        interviewerNotes: interviewerNotes.trim() || undefined,
      },
    };

    scheduleMutation.mutate({ appId: application.id, payload });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in font-sans"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-console-panel border border-console-border rounded-2xl w-full max-w-lg shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-console-panel-raised border-b border-console-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-industry-amber/15 border border-industry-amber/30 flex items-center justify-center text-industry-amber">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-console-text">
                Schedule Candidate Interview
              </h3>
              <p className="text-[11px] font-mono text-console-text-muted">
                Candidate: <span className="text-console-text font-semibold">{application.studentName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-console-text-muted hover:text-console-text hover:bg-console-panel transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {validationError && (
            <div className="p-3 rounded-xl bg-status-red/10 border border-status-red/25 text-status-red text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Round Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-semibold text-console-text flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-industry-amber" />
              <span>Round Title & Scope</span>
            </label>
            <input
              type="text"
              value={roundTitle}
              onChange={e => setRoundTitle(e.target.value)}
              placeholder="e.g. Round 1: Full-Stack & System Design"
              className="w-full bg-console-panel-raised border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder:text-console-text-muted focus:outline-none focus:border-industry-amber"
              required
            />
          </div>

          {/* Round Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-semibold text-console-text flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-bridge-teal" />
              <span>Interview Category</span>
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {[
                { type: 'technical', label: 'Technical' },
                { type: 'system_design', label: 'Sys Design' },
                { type: 'hr', label: 'HR / Culture' },
                { type: 'managerial', label: 'Managerial' },
                { type: 'final', label: 'Final Round' },
              ].map(opt => (
                <button
                  type="button"
                  key={opt.type}
                  onClick={() => setRoundType(opt.type as any)}
                  className={`py-1.5 px-2 rounded-xl text-center border transition-all ${
                    roundType === opt.type
                      ? 'bg-industry-amber/20 border-industry-amber text-industry-amber font-bold'
                      : 'bg-console-panel-raised border-console-border text-console-text-muted hover:text-console-text'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-console-text flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-status-blue" />
                <span>Date</span>
              </label>
              <input
                type="date"
                value={interviewDate}
                onChange={e => setInterviewDate(e.target.value)}
                className="w-full bg-console-panel-raised border border-console-border rounded-xl px-3 py-2 text-xs text-console-text font-mono focus:outline-none focus:border-industry-amber"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-console-text flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-status-amber" />
                <span>Time (with Timezone)</span>
              </label>
              <input
                type="text"
                value={interviewTime}
                onChange={e => setInterviewTime(e.target.value)}
                placeholder="e.g. 11:30 AM IST"
                className="w-full bg-console-panel-raised border border-console-border rounded-xl px-3 py-2 text-xs text-console-text font-mono focus:outline-none focus:border-industry-amber"
                required
              />
            </div>
          </div>

          {/* Video Conference URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-semibold text-console-text flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-status-green" />
              <span>Meeting Link (Google Meet / Zoom)</span>
            </label>
            <input
              type="url"
              value={meetingLink}
              onChange={e => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="w-full bg-console-panel-raised border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text font-mono placeholder:text-console-text-muted focus:outline-none focus:border-industry-amber"
            />
          </div>

          {/* Interviewer Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-semibold text-console-text flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-console-text-muted" />
              <span>Preparation & Interviewer Notes (Optional)</span>
            </label>
            <textarea
              rows={2}
              value={interviewerNotes}
              onChange={e => setInterviewerNotes(e.target.value)}
              placeholder="Topics to focus on, problem set link, or specific panelist questions..."
              className="w-full bg-console-panel-raised border border-console-border rounded-xl px-3.5 py-2 text-xs text-console-text placeholder:text-console-text-muted focus:outline-none focus:border-industry-amber leading-relaxed resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-console-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono text-console-text-muted hover:text-console-text hover:bg-console-panel-raised transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={scheduleMutation.isPending}
              className="px-5 py-2 rounded-xl bg-industry-amber hover:bg-industry-amber/90 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {scheduleMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm & Move to Interview</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
