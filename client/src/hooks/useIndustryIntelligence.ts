/**
 * React Query hooks for Industry Recruitment & Market Intelligence
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  IndustryOverviewDto,
  IndustryFunnelResponse,
  IndustryOpportunityPerformanceResponse,
  IndustrySkillAnalyticsResponse,
  IndustryAssessmentAnalyticsDto,
  IndustryInterviewAnalyticsDto,
  IndustryTrendsDto,
  IntelligenceAiInsight,
} from '@shared/types';

export const industryIntelligenceKeys = {
  all: ['industryIntelligence'] as const,
  overview: () => [...industryIntelligenceKeys.all, 'overview'] as const,
  funnel: (opportunityId?: string) => [...industryIntelligenceKeys.all, 'funnel', { opportunityId }] as const,
  opportunities: (query?: Record<string, any>) => [...industryIntelligenceKeys.all, 'opportunities', query] as const,
  skills: () => [...industryIntelligenceKeys.all, 'skills'] as const,
  assessments: () => [...industryIntelligenceKeys.all, 'assessments'] as const,
  interviews: () => [...industryIntelligenceKeys.all, 'interviews'] as const,
  trends: () => [...industryIntelligenceKeys.all, 'trends'] as const,
  aiSummary: () => [...industryIntelligenceKeys.all, 'aiSummary'] as const,
};

export function useIndustryOverview() {
  return useQuery({
    queryKey: industryIntelligenceKeys.overview(),
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: IndustryOverviewDto }>('/intelligence/industry/overview');
      return res.data;
    },
    staleTime: 30000,
  });
}

export function useIndustryFunnel(opportunityId?: string) {
  return useQuery({
    queryKey: industryIntelligenceKeys.funnel(opportunityId),
    queryFn: async () => {
      const param = opportunityId ? `?opportunityId=${encodeURIComponent(opportunityId)}` : '';
      const res = await api.get<{ success: boolean; data: IndustryFunnelResponse }>(`/intelligence/industry/funnel${param}`);
      return res.data;
    },
    staleTime: 30000,
  });
}

export function useIndustryOpportunityPerformance(query?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: industryIntelligenceKeys.opportunities(query),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query?.page) params.set('page', String(query.page));
      if (query?.limit) params.set('limit', String(query.limit));
      if (query?.search) params.set('search', query.search);
      if (query?.sortBy) params.set('sortBy', query.sortBy);
      if (query?.sortOrder) params.set('sortOrder', query.sortOrder);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get<{ success: boolean; data: IndustryOpportunityPerformanceResponse }>(
        `/intelligence/industry/opportunities${qs}`
      );
      return res.data;
    },
    staleTime: 30000,
  });
}

export function useIndustrySkillDemand() {
  return useQuery({
    queryKey: industryIntelligenceKeys.skills(),
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: IndustrySkillAnalyticsResponse }>('/intelligence/industry/skills');
      return res.data;
    },
    staleTime: 60000,
  });
}

export function useIndustryAssessmentAnalytics() {
  return useQuery({
    queryKey: industryIntelligenceKeys.assessments(),
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: IndustryAssessmentAnalyticsDto }>('/intelligence/industry/assessments');
      return res.data;
    },
    staleTime: 30000,
  });
}

export function useIndustryInterviewAnalytics() {
  return useQuery({
    queryKey: industryIntelligenceKeys.interviews(),
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: IndustryInterviewAnalyticsDto }>('/intelligence/industry/interviews');
      return res.data;
    },
    staleTime: 30000,
  });
}

export function useIndustryTrends() {
  return useQuery({
    queryKey: industryIntelligenceKeys.trends(),
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: IndustryTrendsDto }>('/intelligence/industry/trends');
      return res.data;
    },
    staleTime: 60000,
  });
}

export function useGenerateIndustryAiSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<{ success: boolean; data: IntelligenceAiInsight }>('/intelligence/industry/ai-summary', {});
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(industryIntelligenceKeys.aiSummary(), data);
    },
  });
}
