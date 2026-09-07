import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Check, Image as ImageIcon, AlertCircle, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  currentAvatarUrl?: string | null;
  currentName: string;
  onAvatarUpdated: (newAvatarUrl: string) => void;
}

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({
  isOpen,
  onClose,
  studentId,
  currentAvatarUrl,
  currentName,
  onAvatarUpdated,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const validateAndProcessFile = (file: File) => {
    setError(null);

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file format. Please upload a PNG, JPG, or WEBP image.');
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB limit. Please select a smaller photo.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setZoom(1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await api.upload<{ message: string; avatarUrl: string }>(
        `/students/${studentId}/avatar`,
        formData
      );

      onAvatarUpdated(res.avatarUrl);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-console-panel rounded-2xl border border-console-border shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-console-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-bridge-teal/10 text-bridge-teal flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-console-text">Upload Profile Photo</h3>
              <p className="text-[11px] text-console-muted">PNG, JPG, or WEBP up to 5MB</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-console-muted hover:text-console-text hover:bg-console-bg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-status-red/10 border border-status-red/20 text-status-red text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {previewUrl ? (
            /* Live Circular Crop Preview with Zoom Control */
            <div className="space-y-4 text-center">
              <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-bridge-teal shadow-md bg-console-bg flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Avatar preview"
                  className="w-full h-full object-cover transition-transform duration-100"
                  style={{ transform: `scale(${zoom})` }}
                />
              </div>

              {/* Zoom & Reset Controls */}
              <div className="flex items-center justify-center gap-3 px-4 py-2 bg-console-bg rounded-xl border border-console-border text-xs">
                <ZoomOut className="w-3.5 h-3.5 text-console-muted" />
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  aria-label={`Avatar zoom level: ${zoom}x`}
                  className="w-32 accent-bridge-teal cursor-pointer"
                />
                <ZoomIn className="w-3.5 h-3.5 text-console-muted" />
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="ml-2 p-1 text-console-muted hover:text-bridge-teal"
                  title="Reset Zoom"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-bridge-teal hover:underline inline-flex items-center gap-1"
              >
                <span>Choose different file</span>
              </button>
            </div>
          ) : (
            /* Drag and Drop Zone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-bridge-teal bg-bridge-teal/10 scale-98'
                  : 'border-console-border hover:border-bridge-teal/60 hover:bg-console-bg'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-console-bg border border-console-border text-bridge-teal flex items-center justify-center mx-auto mb-3">
                <Upload className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-xs text-console-text">
                Drag & drop your photo here, or <span className="text-bridge-teal underline">browse</span>
              </h4>
              <p className="text-[11px] text-console-muted mt-1">
                Square ratio recommended. Minimum 200x200px.
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-console-bg border-t border-console-border flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-console-muted hover:text-console-text hover:bg-console-panel transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedFile || uploading}
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
          >
            {uploading ? (
              <span>Saving...</span>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Save Profile Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
