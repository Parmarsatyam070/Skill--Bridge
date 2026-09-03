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

export const ContributionHeatmap: React.FC<{ studentId?: string }> = ({ studentId }) => {
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
    // Align start to the preceding Sunday or Monday
    const startDayOfWeek = startDate.getDay();
    const gridStart = new Date(startDate);
    gridStart.setDate(startDate.getDate() - startDayOfWeek);

    const weeksArray: DayActivity[][] = [];
    const currentCursor = new Date(gridStart);

    // Build 52 weeks (364 days)
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

  const levelColors: Record<number, string> = {
    0: 'bg-paper border border-line hover:border-gray-400',
    1: 'bg-emerald-100 border border-emerald-200 hover:border-emerald-400',
    2: 'bg-emerald-300 border border-emerald-400 hover:border-emerald-500',
    3: 'bg-emerald-500 border border-emerald-600 hover:border-emerald-700',
    4: 'bg-emerald-700 border border-emerald-800 hover:border-emerald-900',
  };

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="bg-white rounded-2xl border border-line p-5 sm:p-6 shadow-2xs space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
        <div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-bridge-teal block">
            Verified Coding & Platform Activity
          </span>
          <h3 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
            Activity Streaks & Contributions
          </h3>
        </div>

        {/* Year Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-paper rounded-xl text-xs font-semibold border border-line">
          <button
            onClick={() => setSelectedYear(2026)}
            className={`px-3 py-1 rounded-lg transition-colors ${
              selectedYear === 2026
                ? 'bg-white text-ink shadow-2xs font-bold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            2026
          </button>
          <button
            onClick={() => setSelectedYear(2025)}
            className={`px-3 py-1 rounded-lg transition-colors ${
              selectedYear === 2025
                ? 'bg-white text-ink shadow-2xs font-bold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            2025
          </button>
        </div>
      </div>

      {/* Stats Ribbon (Four Stat Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        {/* Total Submissions */}
        <div className="p-3 rounded-xl bg-paper border border-line">
          <div className="text-xs text-ink-muted font-sans flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-bridge-teal" />
            <span>Total Submissions</span>
          </div>
          <div className="text-lg font-bold text-ink mt-0.5">
            {data ? data.totalSubmissions : 0}
          </div>
          <div className="text-[10px] text-ink-muted font-sans">in {selectedYear}</div>
        </div>

        {/* Current Streak */}
        <div className="p-3 rounded-xl bg-paper border border-line">
          <div className="text-xs text-ink-muted font-sans flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-industry-amber fill-industry-amber" />
            <span>Current Streak</span>
          </div>
          <div className="text-lg font-bold text-industry-amber mt-0.5">
            {data ? data.currentStreak : user?.currentStreak || 0} Days
          </div>
          <div className="text-[10px] text-ink-muted font-sans">Active daily streak</div>
        </div>

        {/* Longest Streak */}
        <div className="p-3 rounded-xl bg-paper border border-line">
          <div className="text-xs text-ink-muted font-sans flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-status-green" />
            <span>Longest Streak</span>
          </div>
          <div className="text-lg font-bold text-status-green mt-0.5">
            {data ? data.longestStreak : user?.longestStreak || 0} Days
          </div>
          <div className="text-[10px] text-ink-muted font-sans">Personal record</div>
        </div>

        {/* Active Rate */}
        <div className="p-3 rounded-xl bg-paper border border-line">
          <div className="text-xs text-ink-muted font-sans flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-bridge-teal" />
            <span>Active Rate</span>
          </div>
          <div className="text-lg font-bold text-bridge-teal mt-0.5">
            {data ? data.activeRate : '0.0%'}
          </div>
          <div className="text-[10px] text-ink-muted font-sans">Days with verified activity</div>
        </div>
      </div>

      {/* Week-by-Week Calendar Grid */}
      <div className="pt-2 overflow-x-auto">
        <div className="min-w-[680px]">
          {/* Months header labels */}
          <div className="flex text-[10px] font-mono text-ink-muted pl-8 pb-1.5 justify-between pr-2">
            {monthLabels.map((m, i) => (
              <span key={i}>{m}</span>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Days of week row labels (Mon, Wed, Fri) */}
            <div className="flex flex-col justify-between text-[9px] font-mono text-ink-muted pr-2 py-0.5 w-6 flex-shrink-0 select-none">
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
      <div className="pt-2 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-ink-muted">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-bridge-teal flex-shrink-0" />
          {hoveredDay ? (
            <span className="font-mono text-ink font-semibold">
              {hoveredDay.count > 0
                ? `${hoveredDay.count} activity contribution${hoveredDay.count > 1 ? 's' : ''} on ${hoveredDay.date}`
                : `No activity on ${hoveredDay.date}`}
            </span>
          ) : (
            <span className="text-[11px]">Hover over any square to view details</span>
          )}
        </div>

        {/* 5-step green ramp legend */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span>Less</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-[2px] bg-paper border border-line" title="0 actions" />
            <div className="w-3 h-3 rounded-[2px] bg-emerald-100 border border-emerald-200" title="1 action" />
            <div className="w-3 h-3 rounded-[2px] bg-emerald-300 border border-emerald-400" title="2 actions" />
            <div className="w-3 h-3 rounded-[2px] bg-emerald-500 border border-emerald-600" title="3 actions" />
            <div className="w-3 h-3 rounded-[2px] bg-emerald-700 border border-emerald-800" title="4+ actions" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
};
