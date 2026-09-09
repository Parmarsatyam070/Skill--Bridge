import React, { useState } from 'react';
import { useSendCollaborationMessage } from '../../hooks/useCollaborations';
import { Send, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  collaborationId: string;
  disabled?: boolean;
}

export const CollaborationMessageInput: React.FC<Props> = ({
  collaborationId,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messageMutation = useSendCollaborationMessage(collaborationId);

  const charCount = text.length;
  const maxChars = 2000;
  const isValid = text.trim().length > 0 && charCount <= maxChars;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isValid || messageMutation.isPending || disabled) return;

    setErrorMsg(null);
    try {
      await messageMutation.mutateAsync({ message: text.trim() });
      setText('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to send message. Please retry.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-2">
      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || messageMutation.isPending}
          placeholder={
            disabled
              ? 'This collaboration is finalized. Messaging is closed.'
              : 'Write a negotiation message, share schedule notes or deliverables (Ctrl+Enter to send)...'
          }
          rows={3}
          maxLength={maxChars}
          className="w-full bg-[#0b1329] border border-[#1e293b] rounded-xl px-4 py-3 pb-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none disabled:opacity-50 disabled:bg-slate-900"
          aria-label="Collaboration message input"
        />

        {/* Action bar inside textarea */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span
            className={`text-[11px] font-mono ${
              charCount > maxChars ? 'text-rose-400' : 'text-slate-500'
            }`}
          >
            {charCount}/{maxChars}
          </span>

          <button
            type="submit"
            disabled={!isValid || messageMutation.isPending || disabled}
            className="pointer-events-auto px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-500/20"
            aria-label="Send message"
          >
            {messageMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Send</span>
          </button>
        </div>
      </form>
    </div>
  );
};
