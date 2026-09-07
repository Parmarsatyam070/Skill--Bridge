import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, ArrowRight, Loader2, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface OAuthModalProps {
  isOpen: boolean;
  provider: 'google' | 'github' | 'microsoft' | null;
  onClose: () => void;
}

export const OAuthModal: React.FC<OAuthModalProps> = ({ isOpen, provider, onClose }) => {
  const { initiateOAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !provider) return null;

  const getProviderDetails = () => {
    switch (provider) {
      case 'google':
        return {
          shortName: 'Google',
          title: 'Google OAuth 2.0',
          heading: 'Sign in with Google',
          description: 'Authenticate securely using your verified Google account with Firebase Authentication single sign-on.',
          actionLabel: 'Continue with Google',
          icon: (
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          ),
        };
      case 'github':
        return {
          shortName: 'GitHub',
          title: 'GitHub OAuth 2.0',
          heading: 'Sign in with GitHub',
          description: 'Authenticate securely using your GitHub developer profile with verified email and public metadata.',
          actionLabel: 'Continue with GitHub',
          icon: (
            <svg className="w-5 h-5 flex-shrink-0 fill-current text-white" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          ),
        };
      case 'microsoft':
        return {
          shortName: 'Microsoft',
          title: 'Microsoft 365 OAuth 2.0',
          heading: 'Sign in with Microsoft',
          description: 'Authenticate securely using your university or enterprise Microsoft 365 account with Single Sign-On (SSO).',
          actionLabel: 'Continue with Microsoft',
          icon: (
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 23 23">
              <path fill="#f35325" d="M1 1h10v10H1z" />
              <path fill="#81bc06" d="M12 1h10v10H12z" />
              <path fill="#05a6f0" d="M1 12h10v10H1z" />
              <path fill="#ffba08" d="M12 12h10v10H12z" />
            </svg>
          ),
        };
    }
  };

  const details = getProviderDetails();

  const handleLaunchOAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      await initiateOAuth(provider);
      onClose();
    } catch (err: any) {
      setError(err.message || `Failed to initiate ${provider} OAuth flow.`);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="oauth-modal-title"
    >
      <div
        className="relative w-full max-w-md bg-[#131620] border border-[#2E3548] rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] p-6 sm:p-7 space-y-5 text-[#EDEFF3] my-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between pb-3 border-b border-[#262B3A]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2F8C82]/15 border border-[#2F8C82]/30 text-[#2F8C82] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#2F8C82] font-bold">
              VERIFIED OAUTH 2.0
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-xl text-[#9BA3B8] hover:text-white hover:bg-[#222736] border border-transparent hover:border-[#2E3548] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2F8C82]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1C202C] border border-[#2E3548] flex items-center justify-center">
              {details.icon}
            </div>
            <h2 id="oauth-modal-title" className="font-serif text-xl font-bold text-white tracking-tight">
              {details.heading}
            </h2>
          </div>
          <p className="text-xs text-[#9BA3B8] leading-relaxed pt-1">
            {details.description}
          </p>
        </div>

        {/* Error Alert Box (if error exists) */}
        {error && (
          <div
            className="flex items-start gap-3 p-3.5 rounded-xl bg-[#2A151C] border border-[#E5637C]/40 text-[#FFB3C0] text-xs shadow-inner"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 text-[#E5637C] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-[#FF859A] block">Authentication Notice</span>
              <span className="text-[11.5px] leading-relaxed block text-white/90">{error}</span>
            </div>
          </div>
        )}

        {/* Cryptographic Assurance / Security Card */}
        <div className="p-3.5 rounded-xl bg-[#1A1E2B] border border-[#2A3144] space-y-2.5">
          <div className="flex items-center gap-2 text-white font-semibold text-xs">
            <Lock className="w-3.5 h-3.5 text-[#2F8C82]" />
            <span>Cryptographic Identity Assurance</span>
          </div>
          <div className="space-y-1.5 text-[11px] text-[#9BA3B8] leading-relaxed">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4CC38A] flex-shrink-0" />
              <span>Direct Single Sign-On via {details.shortName} official endpoint</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4CC38A] flex-shrink-0" />
              <span>Server-side cryptographic token verification</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4CC38A] flex-shrink-0" />
              <span>SkillBridge never stores your third-party account passwords</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-xl border border-[#2E3548] bg-[#1A1E2B] hover:bg-[#242A3C] text-[#D1D5DB] hover:text-white font-semibold text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#2F8C82]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleLaunchOAuth}
            disabled={loading}
            className="flex-1 py-3 px-5 rounded-xl bg-[#2F8C82] hover:bg-[#26776F] active:bg-[#1E6059] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-teal-900/40 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#2F8C82]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Redirecting to {details.shortName}...</span>
              </>
            ) : (
              <>
                <span>{details.actionLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
