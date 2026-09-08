import React from 'react';
import type { IntelligenceAiInsight } from '@shared/types';
import { Sparkles, AlertTriangle, RefreshCw, CheckCircle, Lightbulb } from 'lucide-react';

interface IntelligenceInsightCardProps {
  insight: IntelligenceAiInsight | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  title?: string;
}

export const IntelligenceInsightCard: React.FC<IntelligenceInsightCardProps> = ({
  insight,
  isLoading,
  onRefresh,
  title = 'AI Executive Advisory Insights',
}) => {
  return (
    <div
      className="p-5 rounded-xl border relative overflow-hidden space-y-4"
      style={{
        background: 'linear-gradient(180deg, #111318 0%, #161a22 100%)',
        borderColor: '#2A2E38',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(47, 140, 130, 0.15)',
              color: '#2F8C82',
              border: '1px solid rgba(47, 140, 130, 0.3)',
            }}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight" style={{ color: '#F4F5F7' }}>
              {title}
            </h3>
            <span className="text-[11px] font-mono" style={{ color: '#8B90A0' }}>
              Strategic synthesis of verified platform signals
            </span>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-50"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              borderColor: '#2A2E38',
              color: '#F4F5F7',
            }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Analyzing...' : 'Refresh AI Analysis'}</span>
          </button>
        )}
      </div>

      {/* Advisory Disclaimer Banner */}
      <div
        className="p-3 rounded-lg border flex items-start gap-2.5 text-xs"
        style={{
          background: 'rgba(232, 162, 60, 0.08)',
          borderColor: 'rgba(232, 162, 60, 0.25)',
          color: '#E8A23C',
        }}
      >
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold block">Advisory AI Intelligence</span>
          <p className="opacity-90 leading-relaxed text-[11px]">
            {insight?.disclaimer ||
              'This is an AI-generated advisory analysis based on aggregate platform data. All hiring and curricular decisions must be verified by humans.'}
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#2F8C82' }} />
          <p className="text-xs" style={{ color: '#8B90A0' }}>
            Synthesizing deterministic metrics and generating strategic insights...
          </p>
        </div>
      ) : insight ? (
        <div className="space-y-4 pt-1">
          {/* Executive Summary */}
          <div className="p-3.5 rounded-lg bg-white/[0.02] border" style={{ borderColor: '#2A2E38' }}>
            <p className="text-xs leading-relaxed font-medium" style={{ color: '#F4F5F7' }}>
              {insight.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Key Observations */}
            <div className="space-y-2">
              <span className="font-semibold flex items-center gap-1.5" style={{ color: '#2F8C82' }}>
                <CheckCircle className="w-3.5 h-3.5" />
                Key Observations
              </span>
              <ul className="space-y-1.5">
                {insight.keyObservations.map((obs, idx) => (
                  <li key={idx} className="p-2 rounded bg-white/[0.02] border leading-relaxed" style={{ borderColor: '#2A2E38', color: '#8B90A0' }}>
                    {obs}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="space-y-2">
              <span className="font-semibold flex items-center gap-1.5" style={{ color: '#4CC38A' }}>
                <Lightbulb className="w-3.5 h-3.5" />
                Recommended Actions
              </span>
              <ul className="space-y-1.5">
                {insight.recommendations.map((rec, idx) => (
                  <li key={idx} className="p-2 rounded bg-white/[0.02] border leading-relaxed" style={{ borderColor: '#2A2E38', color: '#8B90A0' }}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-xs" style={{ color: '#8B90A0' }}>
          Click &quot;Refresh AI Analysis&quot; to generate an executive synthesis of current platform intelligence.
        </div>
      )}
    </div>
  );
};
