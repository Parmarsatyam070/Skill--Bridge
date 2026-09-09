import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Edit3,
} from 'lucide-react';
import { api } from '../../lib/api';
import { UploadedMarksheetDto, MarksheetSubjectDto, SubjectClassification } from '@shared/types';

interface MarksheetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMarksheet?: UploadedMarksheetDto | null;
}

export const MarksheetUploadModal: React.FC<MarksheetUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMarksheet,
}) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [semester, setSemester] = useState<number>(initialMarksheet?.semester || 1);
  const [academicYear, setAcademicYear] = useState<string>(
    initialMarksheet?.academicYear || `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [sgpa, setSgpa] = useState<number | null>(initialMarksheet?.sgpa || 7.5);
  const [totalCredits, setTotalCredits] = useState<number | null>(initialMarksheet?.totalCredits || 24);

  // Verification subjects state
  const [draftMarksheet, setDraftMarksheet] = useState<UploadedMarksheetDto | null>(initialMarksheet || null);
  const [subjectsList, setSubjectsList] = useState<MarksheetSubjectDto[]>(
    initialMarksheet?.subjects || []
  );

  const [step, setStep] = useState<'UPLOAD' | 'VERIFY' | 'SUCCESS'>(
    initialMarksheet ? 'VERIFY' : 'UPLOAD'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch provider status safely
  const [providerInfo, setProviderInfo] = useState<{
    isAiConfigured: boolean;
    provider: string;
    statusMessage: string;
  } | null>(null);

  React.useEffect(() => {
    api.get<{ isAiConfigured: boolean; provider: string; statusMessage: string }>('/academic-performance/provider-status')
      .then(res => setProviderInfo(res))
      .catch(() => setProviderInfo({
        isAiConfigured: false,
        provider: 'Structured Fallback Heuristic Engine',
        statusMessage: 'AI extraction provider is not configured; structured fallback extraction is being used.',
      }));
  }, []);

  // Marksheet Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return api.post<{ marksheet: UploadedMarksheetDto; message: string }>('/academic-performance/marksheets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (data) => {
      setDraftMarksheet(data.marksheet);
      setSubjectsList(data.marksheet.subjects || []);
      setSgpa(data.marksheet.sgpa ?? 7.5);
      setTotalCredits(data.marksheet.totalCredits ?? 24);
      setStep('VERIFY');
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['uploadedMarksheets'] });
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to upload and extract marksheet data');
    },
  });

  // Verify / Save Extracted Subjects Mutation (Step 6)
  const verifyMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return api.put<{ marksheet: UploadedMarksheetDto; message: string }>(`/academic-performance/marksheets/${id}/subjects`, payload);
    },
    onSuccess: (data) => {
      setDraftMarksheet(data.marksheet);
      queryClient.invalidateQueries({ queryKey: ['uploadedMarksheets'] });
      setStep('SUCCESS');
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to verify and save academic subjects');
    },
  });

  // Analyze Performance Mutation (Step 7)
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      return api.post<{ analysis: any; message: string }>('/academic-performance/analyze', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicAnalysis'] });
      queryClient.invalidateQueries({ queryKey: ['uploadedMarksheets'] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to execute academic analysis');
    },
  });

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type) && !/\.(pdf|jpg|jpeg|png)$/i.test(file.name)) {
      setErrorMessage('Please select a valid PDF, JPG, or PNG marksheet document.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Marksheet file size exceeds 10MB limit.');
      return;
    }
    setErrorMessage(null);
    setSelectedFile(file);
  };

  const handleStartUpload = () => {
    if (!selectedFile) {
      setErrorMessage('Please select a marksheet file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('semester', String(semester));
    formData.append('academicYear', academicYear);

    uploadMutation.mutate(formData);
  };

  const handleSubjectChange = (index: number, field: keyof MarksheetSubjectDto, value: any) => {
    setSubjectsList(prev => {
      const copy = [...prev];
      const target = { ...copy[index], [field]: value };

      // Recalculate percentage if marksObtained or maxMarks change
      if (field === 'marksObtained' || field === 'maxMarks') {
        const obtained = field === 'marksObtained' ? value : target.marksObtained;
        const max = field === 'maxMarks' ? value : target.maxMarks || 100;
        if (obtained !== null && obtained !== undefined && max > 0) {
          target.percentage = Math.min(100, Math.max(0, Math.round((obtained / max) * 100 * 10) / 10));
        }
      }

      // Auto-assign backlog if percentage < 40 or grade is F
      if (field === 'percentage') {
        target.isBacklog = value < 40;
        target.isPassed = value >= 40;
      }

      copy[index] = target;
      return copy;
    });
  };

  const handleAddSubjectRow = () => {
    setSubjectsList(prev => [
      ...prev,
      {
        subjectName: 'New Subject',
        normalizedSubject: 'New Subject',
        subjectCode: '',
        marksObtained: 70,
        maxMarks: 100,
        percentage: 70,
        grade: 'B+',
        credits: 3,
        classification: 'CORE',
        isBacklog: false,
        isPassed: true,
      },
    ]);
  };

  const handleRemoveSubjectRow = (index: number) => {
    setSubjectsList(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleConfirmAndSave = () => {
    if (!draftMarksheet?.id) return;
    if (subjectsList.length === 0) {
      setErrorMessage('At least one subject is required.');
      return;
    }

    const payload = {
      semester,
      academicYear,
      sgpa: sgpa ? parseFloat(String(sgpa)) : null,
      totalCredits: totalCredits ? parseFloat(String(totalCredits)) : null,
      subjects: subjectsList.map(s => ({
        subjectCode: s.subjectCode || null,
        subjectName: s.subjectName.trim(),
        normalizedSubject: s.normalizedSubject?.trim() || s.subjectName.trim(),
        marksObtained: s.marksObtained !== undefined ? Number(s.marksObtained) : null,
        maxMarks: s.maxMarks !== undefined ? Number(s.maxMarks) : 100,
        percentage: Number(s.percentage) || 0,
        grade: s.grade || null,
        credits: s.credits !== undefined ? Number(s.credits) : 3,
        classification: s.classification || 'GENERAL',
        isBacklog: Boolean(s.isBacklog),
        isPassed: !s.isBacklog,
      })),
    };

    verifyMutation.mutate({ id: draftMarksheet.id, payload });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0b1329] border border-[#1e293b] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/80">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
              step === 'SUCCESS'
                ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400'
                : 'bg-blue-600/20 border-blue-500/30 text-blue-400'
            }`}>
              {step === 'SUCCESS' ? <CheckCircle2 className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {step === 'UPLOAD' && 'Upload Semester Marksheet'}
                {step === 'VERIFY' && 'Review & Edit Extracted Academic Data'}
                {step === 'SUCCESS' && 'Academic Data Verified Successfully'}
              </h3>
              <p className="text-xs text-slate-400">
                {step === 'UPLOAD' && 'Supports official university marksheets in PDF, JPG, and PNG formats (Max 10MB).'}
                {step === 'VERIFY' && 'Inspect and modify extracted subjects, marks, grades, and domain classifications.'}
                {step === 'SUCCESS' && 'Marksheet subjects validated and saved. You can now execute academic performance analysis.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 flex items-start gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="space-y-6 py-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white">
                  Academic Data Verified Successfully
                </h4>
                <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
                  All <strong className="text-emerald-400">{subjectsList.length} subjects</strong> for Semester {semester} ({academicYear}) have been verified and saved to your academic profile with status <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px]">VERIFIED</span>.
                </p>
              </div>

              {/* Verified Metadata Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Semester</div>
                  <div className="text-base font-bold text-white mt-0.5">Semester {semester}</div>
                </div>
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Verified Subjects</div>
                  <div className="text-base font-bold text-cyan-400 mt-0.5">{subjectsList.length} Subjects</div>
                </div>
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">SGPA</div>
                  <div className="text-base font-bold text-white mt-0.5">{sgpa || 'N/A'}</div>
                </div>
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Status</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">VERIFIED</div>
                </div>
              </div>

              <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ready for Domain-Aware Performance Analysis</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Execute the domain analysis engine to calculate weakness scores, multi-term trends, radar pillars, and personalized 6-stage roadmaps.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 'UPLOAD' && (
            <div className="space-y-5">
              {/* Provider Info Banner */}
              {providerInfo && (
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{providerInfo.statusMessage}</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                    providerInfo.isAiConfigured
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {providerInfo.provider}
                  </span>
                </div>
              )}

              {/* Semester & Year Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Semester Number
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(parseInt(e.target.value, 10))}
                    className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="e.g. 2023-2024"
                    className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Drag & Drop Upload Zone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Official Marksheet Document (PDF / JPG / PNG)
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-blue-500 bg-blue-500/10'
                      : selectedFile
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-[#1e293b] hover:border-slate-600 bg-[#0f172a]/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/jpg"
                    onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
                    className="hidden"
                  />

                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>

                    {selectedFile ? (
                      <div>
                        <p className="text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for academic data extraction
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-white">
                          Drag and drop your marksheet here, or <span className="text-blue-400">browse</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Supported formats: PDF, JPG, PNG (Max 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'VERIFY' && (
            <div className="space-y-4">
              {/* Draft Status Banner */}
              <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">Semester {semester} Marksheet Draft</span>
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-2 py-0.5 rounded-full font-medium">
                      Action Required: Review & Confirm
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {draftMarksheet?.extractionNotes || 'Review extracted subjects and adjust marks or grades if needed before saving.'}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">SGPA:</span>
                    <input
                      type="number"
                      step="0.01"
                      value={sgpa || ''}
                      onChange={(e) => setSgpa(e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-16 bg-[#131f37] border border-[#1e293b] rounded-lg px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Credits:</span>
                    <input
                      type="number"
                      value={totalCredits || ''}
                      onChange={(e) => setTotalCredits(e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-16 bg-[#131f37] border border-[#1e293b] rounded-lg px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Editable Subjects Table */}
              <div className="border border-[#1e293b] rounded-xl overflow-x-auto bg-[#0f172a]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#131f37] text-slate-300 border-b border-[#1e293b] font-semibold text-[11px]">
                      <th className="p-2.5">Subject Name</th>
                      <th className="p-2.5 w-24">Code</th>
                      <th className="p-2.5 w-20">Marks</th>
                      <th className="p-2.5 w-16">Max</th>
                      <th className="p-2.5 w-16">Score %</th>
                      <th className="p-2.5 w-16">Grade</th>
                      <th className="p-2.5 w-16">Credits</th>
                      <th className="p-2.5 w-36">Domain Role</th>
                      <th className="p-2.5 w-20 text-center">Backlog</th>
                      <th className="p-2.5 w-10 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b] text-slate-300">
                    {subjectsList.map((subj, idx) => (
                      <tr key={idx} className="hover:bg-[#131f37]/50 transition-colors">
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={subj.subjectName}
                            onChange={(e) => handleSubjectChange(idx, 'subjectName', e.target.value)}
                            className="w-full bg-[#131f37] border border-[#1e293b] rounded-lg px-2 py-1.5 text-xs text-white focus:border-blue-500 outline-none"
                          />
                        </td>

                        <td className="p-2.5">
                          <input
                            type="text"
                            value={subj.subjectCode || ''}
                            onChange={(e) => handleSubjectChange(idx, 'subjectCode', e.target.value)}
                            placeholder="e.g. CS201"
                            className="w-full bg-[#131f37] border border-[#1e293b] rounded-lg px-2 py-1.5 text-xs text-white focus:border-blue-500 outline-none uppercase"
                          />
                        </td>

                        <td className="p-2.5">
                          <input
                            type="number"
                            value={subj.marksObtained !== null && subj.marksObtained !== undefined ? subj.marksObtained : ''}
                            onChange={(e) => handleSubjectChange(idx, 'marksObtained', e.target.value ? parseFloat(e.target.value) : null)}
                            className="w-full bg-[#131f37] border border-[#1e293b] rounded-lg px-2 py-1.5 text-xs text-white focus:border-blue-500 outline-none text-right font-medium"
                          />
                        </td>

                        <td className="p-2.5">
                          <input
                            type="number"
                            value={subj.maxMarks || 100}
                            onChange={(e) => handleSubjectChange(idx, 'maxMarks', parseFloat(e.target.value))}
                            className="w-full bg-[#131f37] border border-[#1e293b] rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:border-blue-500 outline-none text-right"
                          />
                        </td>

                        <td className="p-2.5 text-right font-bold text-cyan-400">
                          {subj.percentage}%
                        </td>

                        <td className="p-2.5">
                          <input
                            type="text"
                            value={subj.grade || ''}
                            onChange={(e) => handleSubjectChange(idx, 'grade', e.target.value.toUpperCase())}
                            className="w-full bg-[#131f37] border border-[#1e293b] rounded-lg px-2 py-1.5 text-xs text-white focus:border-blue-500 outline-none text-center uppercase font-semibold"
                          />
                        </td>

                        <td className="p-2.5">
                          <input
                            type="number"
                            value={subj.credits || 3}
                            onChange={(e) => handleSubjectChange(idx, 'credits', parseFloat(e.target.value))}
                            className="w-full bg-[#131f37] border border-[#1e293b] rounded-lg px-2 py-1.5 text-xs text-white focus:border-blue-500 outline-none text-center"
                          />
                        </td>

                        <td className="p-2.5">
                          <select
                            value={subj.classification}
                            onChange={(e) => handleSubjectChange(idx, 'classification', e.target.value as SubjectClassification)}
                            className="w-full bg-[#131f37] border border-[#1e293b] rounded-lg px-2 py-1.5 text-xs text-white focus:border-blue-500 outline-none"
                          >
                            <option value="CORE">CORE</option>
                            <option value="SUPPORTING">SUPPORTING</option>
                            <option value="GENERAL">GENERAL</option>
                            <option value="UNRELATED">UNRELATED</option>
                          </select>
                        </td>

                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(subj.isBacklog)}
                            onChange={(e) => handleSubjectChange(idx, 'isBacklog', e.target.checked)}
                            className="w-4 h-4 rounded border-[#1e293b] text-rose-500 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => handleRemoveSubjectRow(idx)}
                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Subject Row Button */}
              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={handleAddSubjectRow}
                  className="px-3.5 py-1.5 bg-[#0f172a] hover:bg-[#131f37] text-slate-300 text-xs font-medium rounded-xl border border-[#1e293b] flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  Add Subject Row
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-[#1e293b] flex items-center justify-between bg-[#0f172a]/80">
          {step === 'VERIFY' ? (
            <button
              onClick={() => setStep('UPLOAD')}
              className="px-4 py-2 bg-transparent hover:bg-slate-800 text-slate-400 text-xs rounded-xl transition-colors"
            >
              &larr; Re-upload File
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {step === 'SUCCESS' ? (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-slate-300 text-xs rounded-xl border border-[#1e293b] transition-colors"
                >
                  Close / Review on Dashboard
                </button>
                <button
                  disabled={analyzeMutation.isPending}
                  onClick={() => analyzeMutation.mutate()}
                  className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analyzing your academic performance...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analyze Performance</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-slate-300 text-xs rounded-xl border border-[#1e293b] transition-colors"
                >
                  Cancel
                </button>

                {step === 'UPLOAD' ? (
                  <button
                    disabled={!selectedFile || uploadMutation.isPending}
                    onClick={handleStartUpload}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Extracting Academic Data...
                      </>
                    ) : (
                      <>
                        <span>Extract & Review Marksheet</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    disabled={verifyMutation.isPending || subjectsList.length === 0}
                    onClick={handleConfirmAndSave}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {verifyMutation.isPending ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Validating & Saving Academic Data...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm & Save Academic Data</span>
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
