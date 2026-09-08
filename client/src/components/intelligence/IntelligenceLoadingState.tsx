import React from 'react';

export const IntelligenceLoadingState: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse p-6">
      {/* KPI Skeleton Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="h-24 rounded-xl border bg-white/[0.02]"
            style={{ borderColor: '#2A2E38' }}
          />
        ))}
      </div>

      {/* Main Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className="lg:col-span-2 h-80 rounded-xl border bg-white/[0.02]"
          style={{ borderColor: '#2A2E38' }}
        />
        <div
          className="h-80 rounded-xl border bg-white/[0.02]"
          style={{ borderColor: '#2A2E38' }}
        />
      </div>

      {/* Table Skeleton */}
      <div
        className="h-64 rounded-xl border bg-white/[0.02]"
        style={{ borderColor: '#2A2E38' }}
      />
    </div>
  );
};
