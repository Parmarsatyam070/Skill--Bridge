import React, { useEffect, useRef } from 'react';
import type { CollaborationMessageDto } from '@shared/types';
import { MessageSquare, User, Building2, GraduationCap, Shield } from 'lucide-react';

interface Props {
  messages: CollaborationMessageDto[];
  currentUserId?: string;
}

export const CollaborationMessageThread: React.FC<Props> = ({
  messages,
  currentUserId,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!messages || messages.length === 0) {
    return (
      <div className="py-12 px-4 flex flex-col items-center justify-center text-center bg-[#0b1329]/50 border border-dashed border-[#1e293b] rounded-2xl">
        <div className="w-10 h-10 rounded-full bg-[#0f172a] border border-[#1e293b] flex items-center justify-center text-blue-400 mb-3">
          <MessageSquare className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-semibold text-white mb-1">
          No messages yet
        </h4>
        <p className="text-xs text-slate-400 max-w-sm">
          Use the negotiation thread to coordinate workshop dates, student eligibility, curriculum syllabi, or mentor requirements.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
      {messages.map((msg) => {
        const isSelf = currentUserId && msg.senderUserId === currentUserId;
        const sender = msg.senderUser;
        const senderRole = sender?.role || '';

        const roleBadge = (() => {
          if (senderRole === 'INDUSTRY') {
            return {
              label: 'Industry',
              icon: Building2,
              className: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
            };
          }
          if (senderRole === 'INSTITUTION_ADMIN') {
            return {
              label: 'Institution',
              icon: GraduationCap,
              className: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
            };
          }
          return {
            label: senderRole || 'User',
            icon: Shield,
            className: 'bg-slate-800 text-slate-300 border-slate-700',
          };
        })();

        const RoleIcon = roleBadge.icon;

        const formattedTime = new Date(msg.createdAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div
            key={msg.id}
            className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
          >
            {/* Header: Sender info & timestamp */}
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <span className="text-xs font-semibold text-white">
                {sender?.name || 'Participant'}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded-full border ${roleBadge.className}`}
              >
                <RoleIcon className="w-2.5 h-2.5" />
                {roleBadge.label}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {formattedTime}
              </span>
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                isSelf
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20 rounded-tr-xs'
                  : 'bg-[#0f172a] border border-[#1e293b] text-slate-200 rounded-tl-xs'
              }`}
            >
              {msg.message}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};
