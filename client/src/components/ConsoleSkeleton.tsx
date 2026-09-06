import React from 'react';

export const ConsoleSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto animate-pulse space-y-5 sm:space-y-6 font-sans">
      {/* Top Banner Skeleton — Traders Hub & Sentry rounded card */}
      <div className="bg-[#0b1222]/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2.5 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-5 w-32 bg-slate-800/80 rounded-full"></div>
            <div className="h-4 w-24 bg-slate-800/50 rounded-md"></div>
          </div>
          <div className="h-7 w-64 sm:w-80 bg-slate-800 rounded-xl"></div>
          <div className="h-4 w-full max-w-md bg-slate-800/60 rounded-md"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-32 bg-slate-800 rounded-full"></div>
          <div className="h-10 w-28 bg-slate-800/60 rounded-full"></div>
        </div>
      </div>

      {/* 4 Stat Tiles Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="h-24 rounded-3xl bg-[#0b1222]/80 border border-slate-800/80 p-5 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex-shrink-0"></div>
            <div className="space-y-2 flex-1">
              <div className="h-3 w-16 bg-slate-800/60 rounded"></div>
              <div className="h-5 w-20 bg-slate-800 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 h-80 rounded-3xl bg-[#0b1222]/80 border border-slate-800/80 p-6 flex items-center justify-center">
          <div className="flex items-center gap-3 text-cyan-400 font-mono text-xs">
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Calibrating workspace...</span>
          </div>
        </div>
        <div className="lg:col-span-5 h-80 rounded-3xl bg-[#0b1222]/80 border border-slate-800/80 p-6 space-y-4">
          <div className="h-5 w-40 bg-slate-800 rounded"></div>
          <div className="h-16 bg-slate-800/40 rounded-2xl"></div>
          <div className="h-16 bg-slate-800/40 rounded-2xl"></div>
          <div className="h-10 bg-slate-800/60 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default ConsoleSkeleton;
