import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCheck,
  Flame,
  BookOpen,
  Sparkles,
  Award,
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { api } from '../lib/api';
import { InAppNotification } from '@shared/types';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data, isLoading } = useQuery<{
    notifications: InAppNotification[];
    unreadCount: number;
    dailyPracticeCompletedToday: boolean;
  }>({
    queryKey: ['inAppNotifications'],
    queryFn: () => api.get('/notifications'),
    refetchInterval: 30000,
  });

  // Mark all or single as read mutation
  const markReadMutation = useMutation({
    mutationFn: (notificationId?: string) =>
      api.post('/notifications/mark-read', { notificationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inAppNotifications'] });
    },
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'DAILY_PRACTICE':
      case 'STREAK':
        return <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />;
      case 'RESOURCE_RECOMMENDATION':
        return <BookOpen className="w-4 h-4 text-cyan-400" />;
      case 'SKILL_GAP':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'MATCH_UPDATE':
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
      default:
        return <Award className="w-4 h-4 text-indigo-400" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/80 transition-all duration-200 focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-750 shadow-2xl shadow-slate-950/80 backdrop-blur-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-slate-850 border-b border-slate-750">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markReadMutation.mutate(undefined)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">No new notifications</p>
                <p className="text-[11px] text-slate-500">You're all caught up!</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`p-3.5 transition-colors hover:bg-slate-850/60 ${
                    !n.read ? 'bg-indigo-950/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {getNotificationIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4 className="text-xs font-bold text-slate-200 truncate">{n.title}</h4>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>

                      {n.link && (
                        <div className="mt-2 flex items-center justify-between">
                          <Link
                            to={n.link}
                            onClick={() => {
                              if (!n.read) markReadMutation.mutate(n.id);
                              setIsOpen(false);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            <span>Take Action</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>

                          {!n.read && (
                            <button
                              type="button"
                              onClick={() => markReadMutation.mutate(n.id)}
                              className="text-[10px] text-slate-500 hover:text-slate-300"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-850/90 border-t border-slate-750 text-center">
            <Link
              to="/learn"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-semibold text-slate-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1.5"
            >
              <BookOpen className="w-3 h-3" />
              <span>Explore Learning Resources (/learn)</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
