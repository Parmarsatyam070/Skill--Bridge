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

  // Black & Blue Design System verified heatmap colors
  const levelColors: Record<number, string> = {
    0: 'bg-[#0f172a] border border-[#1e293b] hover:border-slate-700',
    1: 'bg-blue-950/80 border border-blue-900/60 hover:border-blue-700',
    2: 'bg-blue-800/80 border border-blue-700 hover:border-blue-500',
    3: 'bg-blue-600 border border-blue-500 hover:border-blue-400 shadow-xs shadow-blue-500/30',
    4: 'bg-sky-400 border border-sky-300 hover:border-white shadow-sm shadow-sky-400/50',
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
    <div className="bg-[#0b1329] rounded-xl border border-[#1e293b] p-5 sm:p-6 space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e293b]">
        <div>
          <span className="small-caps-label block mb-0.5 text-slate-400">
            [● VERIFIED ACTIVITY TELEMETRY]
          </span>
          <h3 className="text-base font-bold text-white tracking-tight">
            Activity Streaks & Contributions
          </h3>
        </div>

        {/* Year Filter Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-[#0f172a] rounded-lg border border-[#1e293b] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSelectedYear(2026)}
            className={`px-3 py-1 rounded-md transition-all font-mono text-xs ${
              selectedYear === 2026
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2026
          </button>
          <button
            type="button"
            onClick={() => setSelectedYear(2025)}
            className={`px-3 py-1 rounded-md transition-all font-mono text-xs ${
              selectedYear === 2025
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold'
                : 'text-slate-400 hover:text-white'
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
              className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3 sm:p-3.5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="small-caps-label truncate text-[10px] text-slate-400">{stat.label}</span>
                <Icon className="w-3.5 h-3.5 text-blue-400 opacity-90 shrink-0" />
              </div>
              <div className="font-mono text-xl sm:text-2xl font-semibold tracking-tight text-white my-0.5">
                {stat.value}
              </div>
              <span className="text-[11px] text-slate-400 truncate">{stat.subValue}</span>
            </div>
          );
        })}
      </div>

      {/* Week-by-Week Calendar Grid */}
      <div className="pt-1 overflow-x-auto touch-scroll">
        <div className="min-w-[680px]">
          {/* Months header labels */}
          <div className="flex text-[10px] font-mono text-slate-400 pl-8 pb-1.5 justify-between pr-2">
            {monthLabels.map((m, i) => (
              <span key={i}>{m}</span>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Days of week row labels (Mon, Wed, Fri) */}
            <div className="flex flex-col justify-between text-[9px] font-mono text-slate-400 pr-2 py-0.5 w-6 flex-shrink-0 select-none">
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
      <div className="pt-2.5 border-t border-[#1e293b] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2 min-h-[20px]">
          <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          {hoveredDay ? (
            <span className="font-mono text-white font-semibold">
              {hoveredDay.count > 0
                ? `${hoveredDay.count} verified action${hoveredDay.count > 1 ? 's' : ''} on ${hoveredDay.date}`
                : `No recorded activity on ${hoveredDay.date}`}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">Hover over any day square to view activity details</span>
          )}
        </div>

        {/* 5-step ramp legend */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
          <span>Less</span>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-[2px] bg-[#0f172a] border border-[#1e293b]" title="0 actions" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-blue-950/80 border border-blue-900/60" title="1 action" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-blue-800/80 border border-blue-700" title="2 actions" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-blue-600 border border-blue-500" title="3 actions" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-sky-400 border border-sky-300" title="4+ actions" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
});
