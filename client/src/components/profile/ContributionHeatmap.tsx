import React, { useState, useEffect, useMemo } from 'react';
import { Flame, Trophy, Calendar, CheckCircle2, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { ActivityHeatmapResponse } from '@shared/types';

interface DayActivity {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export const ContributionHeatmap: React.FC<{ studentId?: string }> = React.memo(({ studentId }) => {
  const { user } = useAuth();
  const effectiveStudentId = studentId || user?.studentProfile?.id;

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<ActivityHeatmapResponse | null>(null);
  const [hoveredDay, setHoveredDay] = useState<DayActivity | null>(null);

  useEffect(() => {
    if (!effectiveStudentId) return;

    let isMounted = true;
    setLoading(true);

    api.get<ActivityHeatmapResponse>(`/students/${effectiveStudentId}/activity-heatmap?year=${selectedYear}`)
      .then(res => {
        if (isMounted) {
          setData(res);
        }
      })
      .catch(err => {
        console.error('Error fetching activity heatmap:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveStudentId, selectedYear]);

  // Construct full 52-week calendar for the selected year
  const weeks = useMemo(() => {
    const logMap = new Map<string, { count: number; level: 0 | 1 | 2 | 3 | 4 }>();
    if (data?.logs) {
      for (const log of data.logs) {
        logMap.set(log.date, { count: log.count, level: log.level });
      }
    }

    const startDate = new Date(selectedYear, 0, 1);
    const startDayOfWeek = startDate.getDay();
    const gridStart = new Date(startDate);
    gridStart.setDate(startDate.getDate() - startDayOfWeek);

    const weeksArray: DayActivity[][] = [];
    const currentCursor = new Date(gridStart);

    for (let w = 0; w < 52; w++) {
      const weekDays: DayActivity[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = currentCursor.toISOString().split('T')[0];
        const record = logMap.get(dateStr);
        const count = record ? record.count : 0;
        const level = record ? record.level : 0;

        weekDays.push({
          date: dateStr,
          count,
          level,
        });

        currentCursor.setDate(currentCursor.getDate() + 1);
      }
      weeksArray.push(weekDays);
    }

    return weeksArray;
  }, [data, selectedYear]);

  // Design System v2 verified heatmap colors
  const levelColors: Record<number, string> = {
    0: 'bg-[#1A1D24] border border-[#2A2E38]/80 hover:border-[#3d4352]',
    1: 'bg-[#2F8C82]/25 border border-[#2F8C82]/30 hover:border-[#2F8C82]/60',
    2: 'bg-[#2F8C82]/55 border border-[#2F8C82]/60 hover:border-[#2F8C82]',
    3: 'bg-[#2F8C82] border border-[#2F8C82] hover:border-white shadow-xs shadow-[#2F8C82]/30',
    4: 'bg-[#4CC38A] border border-[#4CC38A] hover:border-white shadow-sm shadow-[#4CC38A]/50',
  };

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const telemetryStats = [
    {
      label: 'Total Actions',
      value: data ? data.totalSubmissions : 0,
      subValue: `in ${selectedYear}`,
      icon: Calendar,
    },
    {
      label: 'Current Streak',
      value: `${data ? data.currentStreak : user?.currentStreak || 0}d`,
      subValue: 'Daily active streak',
      icon: Flame,
    },
    {
      label: 'Longest Streak',
      value: `${data ? data.longestStreak : user?.longestStreak || 0}d`,
      subValue: 'Personal record',
      icon: Trophy,
    },
    {
      label: 'Active Rate',
      value: data ? data.activeRate : '0.0%',
      subValue: 'Platform consistency',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="bg-bridge-panel rounded-xl border border-bridge-border p-5 sm:p-6 space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-bridge-border/60">
        <div>
          <span className="small-caps-label block mb-0.5">
            [● VERIFIED ACTIVITY TELEMETRY]
          </span>
          <h3 className="text-base font-bold text-[#F4F5F7] tracking-tight">
            Activity Streaks & Contributions
          </h3>
        </div>

        {/* Year Filter Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-white/[0.03] rounded-lg border border-white/5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSelectedYear(2026)}
            className={`px-3 py-1 rounded-md transition-all font-mono text-xs ${
              selectedYear === 2026
                ? 'bg-[#2F8C82]/20 text-[#2F8C82] font-bold'
                : 'text-[#8B90A0] hover:text-[#F4F5F7]'
            }`}
          >
            2026
          </button>
          <button
            type="button"
            onClick={() => setSelectedYear(2025)}
            className={`px-3 py-1 rounded-md transition-all font-mono text-xs ${
              selectedYear === 2025
                ? 'bg-[#2F8C82]/20 text-[#2F8C82] font-bold'
                : 'text-[#8B90A0] hover:text-[#F4F5F7]'
            }`}
          >
            2025
          </button>
        </div>
      </div>

      {/* Stats Ribbon - Streamlined 4-Cell Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {telemetryStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3 sm:p-3.5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="small-caps-label truncate text-[10px]">{stat.label}</span>
                <Icon className="w-3.5 h-3.5 text-[#2F8C82] opacity-80 shrink-0" />
              </div>
              <div className="font-mono text-xl sm:text-2xl font-semibold tracking-tight text-[#F4F5F7] my-0.5">
                {stat.value}
              </div>
              <span className="text-[11px] text-[#8B90A0] truncate">{stat.subValue}</span>
            </div>
          );
        })}
      </div>

      {/* Week-by-Week Calendar Grid */}
      <div className="pt-1 overflow-x-auto touch-scroll">
        <div className="min-w-[680px]">
          {/* Months header labels */}
          <div className="flex text-[10px] font-mono text-slate-500 pl-8 pb-1.5 justify-between pr-2">
            {monthLabels.map((m, i) => (
              <span key={i}>{m}</span>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Days of week row labels (Mon, Wed, Fri) */}
            <div className="flex flex-col justify-between text-[9px] font-mono text-slate-500 pr-2 py-0.5 w-6 flex-shrink-0 select-none">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            {/* Weeks columns */}
            <div className="flex gap-[3px] flex-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px] flex-1">
                  {week.map((day, dIdx) => (
                    <div
                      key={dIdx}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`aspect-square rounded-[3px] transition-all cursor-pointer ${
                        levelColors[day.level]
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Details Tooltip & Legend */}
      <div className="pt-2.5 border-t border-bridge-border/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#8B90A0]">
        <div className="flex items-center gap-2 min-h-[20px]">
          <Info className="w-3.5 h-3.5 text-[#2F8C82] flex-shrink-0" />
          {hoveredDay ? (
            <span className="font-mono text-[#F4F5F7] font-semibold">
              {hoveredDay.count > 0
                ? `${hoveredDay.count} verified action${hoveredDay.count > 1 ? 's' : ''} on ${hoveredDay.date}`
                : `No recorded activity on ${hoveredDay.date}`}
            </span>
          ) : (
            <span className="text-[11px] text-[#8B90A0]">Hover over any day square to view activity details</span>
          )}
        </div>

        {/* 5-step ramp legend */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8B90A0]">
          <span>Less</span>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1A1D24] border border-[#2A2E38]/80" title="0 actions" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-[#2F8C82]/25" title="1 action" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-[#2F8C82]/55" title="2 actions" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-[#2F8C82]" title="3 actions" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4CC38A]" title="4+ actions" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
});
