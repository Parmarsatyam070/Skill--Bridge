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
      className="p-5 rounded-xl border border-[#1e293b] bg-[#0b1329] relative overflow-hidden space-y-4 shadow-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-600/15 text-blue-400 border border-blue-500/30"
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white">
              {title}
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Strategic synthesis of verified platform signals
            </span>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#1e293b] bg-[#0f172a] text-slate-200 hover:border-blue-500/40 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Analyzing...' : 'Refresh AI Analysis'}</span>
          </button>
        )}
      </div>

      {/* Advisory Disclaimer Banner */}
      <div
        className="p-3 rounded-lg border border-amber-500/25 bg-amber-500/10 flex items-start gap-2.5 text-xs text-amber-300"
      >
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
        <div className="space-y-0.5">
          <span className="font-semibold block">Advisory AI Intelligence</span>
          <p className="opacity-90 leading-relaxed text-[11px] text-slate-300">
            {insight?.disclaimer ||
              'This is an AI-generated advisory analysis based on aggregate platform data. All hiring and curricular decisions must be verified by humans.'}
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">
            Synthesizing deterministic metrics and generating strategic insights...
          </p>
        </div>
      ) : insight ? (
        <div className="space-y-4 pt-1">
          {/* Executive Summary */}
          <div className="p-3.5 rounded-lg bg-[#0f172a] border border-[#1e293b]">
            <p className="text-xs leading-relaxed font-medium text-slate-200">
              {insight.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Key Observations */}
            <div className="space-y-2">
              <span className="font-semibold flex items-center gap-1.5 text-blue-400">
                <CheckCircle className="w-3.5 h-3.5" />
                Key Observations
              </span>
              <ul className="space-y-1.5">
                {insight.keyObservations.map((obs, idx) => (
                  <li key={idx} className="p-2 rounded bg-[#0f172a] border border-[#1e293b] leading-relaxed text-slate-300">
                    {obs}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="space-y-2">
              <span className="font-semibold flex items-center gap-1.5 text-emerald-400">
                <Lightbulb className="w-3.5 h-3.5" />
                Recommended Actions
              </span>
              <ul className="space-y-1.5">
                {insight.recommendations.map((rec, idx) => (
                  <li key={idx} className="p-2 rounded bg-[#0f172a] border border-[#1e293b] leading-relaxed text-slate-300">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-slate-400">
          Click &quot;Refresh AI Analysis&quot; to generate an executive synthesis of current platform intelligence.
        </div>
      )}
    </div>
  );
};
