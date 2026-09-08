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
      <div className="py-12 px-4 flex flex-col items-center justify-center text-center bg-[#111318]/50 border border-dashed border-[#2A2E38] rounded-2xl">
        <div className="w-10 h-10 rounded-full bg-[#1A1D24] flex items-center justify-center text-[#2F8C82] mb-3">
          <MessageSquare className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-semibold text-[#F4F5F7] mb-1">
          No messages yet
        </h4>
        <p className="text-xs text-[#8B90A0] max-w-sm">
          Use the negotiation thread to coordinate workshop dates, student eligibility, curriculum syllabi, or mentor requirements.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
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
              className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
            };
          }
          return {
            label: senderRole || 'User',
            icon: Shield,
            className: 'bg-zinc-800 text-zinc-300 border-zinc-700',
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
              <span className="text-xs font-semibold text-[#F4F5F7]">
                {sender?.name || 'Participant'}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded-full border ${roleBadge.className}`}
              >
                <RoleIcon className="w-2.5 h-2.5" />
                {roleBadge.label}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {formattedTime}
              </span>
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                isSelf
                  ? 'bg-[#2F8C82]/20 border border-[#2F8C82]/40 text-[#F4F5F7] rounded-tr-xs'
                  : 'bg-[#1A1D24] border border-[#2A2E38] text-zinc-200 rounded-tl-xs'
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
