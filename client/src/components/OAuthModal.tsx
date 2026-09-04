import React, { useState } from 'react';
import { X, ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
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

  if (!isOpen || !provider) return null;

  const getProviderDetails = () => {
    switch (provider) {
      case 'google':
        return {
          title: 'Google OAuth 2.0',
          subtitle: 'Sign in with your Google account',
          envVars: 'GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET',
        };
      case 'github':
        return {
          title: 'GitHub OAuth 2.0',
          subtitle: 'Sign in with your developer profile',
          envVars: 'GITHUB_CLIENT_ID & GITHUB_CLIENT_SECRET',
        };
      case 'microsoft':
        return {
          title: 'Microsoft 365 OAuth 2.0',
          subtitle: 'Sign in with your institutional or work account',
          envVars: 'MICROSOFT_CLIENT_ID & MICROSOFT_CLIENT_SECRET',
        };
    }
  };

  const details = getProviderDetails();

  const handleLaunchOAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      await initiateOAuth(provider);
    } catch (err: any) {
      setError(err.message || `Failed to initiate ${provider} OAuth flow.`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-canvas-subtle rounded-2xl border border-line max-w-md w-full p-6 shadow-2xl space-y-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-bridge-teal/10 border border-bridge-teal/20 text-bridge-teal flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-bridge-teal font-semibold">
                OAuth 2.0 Authorization
              </span>
              <h3 className="font-serif text-base font-bold text-ink">{details.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-paper transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-status-red/10 border border-status-red/20 text-status-red text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block">OAuth Provider Configuration Required</span>
              <span className="text-[11px] opacity-90 block">{error}</span>
              <span className="text-[10px] font-mono opacity-75 block">Add to Render Environment: {details.envVars}</span>
            </div>
          </div>
        )}

        <div className="space-y-3 text-xs font-sans text-ink-muted leading-relaxed">
          <p>
            You are about to authenticate directly through <strong className="text-ink">{details.title}</strong> using real, signature-verified OAuth 2.0 authorization code grant.
          </p>
          <div className="p-3 rounded-xl bg-paper/40 border border-line space-y-1 text-[11px]">
            <div className="flex items-center gap-1.5 text-ink font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-bridge-teal" />
              <span>Cryptographic Identity Assurance</span>
            </div>
            <p className="text-ink-muted text-[11px]">
              SkillBridge verifies server-side identity signatures without storing your third-party credentials.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-line text-ink-muted hover:text-ink hover:bg-paper font-medium text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleLaunchOAuth}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-bridge-teal hover:bg-bridge-teal-dark text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Redirecting...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
