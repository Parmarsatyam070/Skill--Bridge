/**
 * React Query hooks for Academic Institution Skill Intelligence
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  InstitutionOverviewDto,
  InstitutionSkillsResponse,
  AffectedStudentsResponse,
  InstitutionInterventionsResponse,
  InstitutionTrendsDto,
  IntelligenceAiInsight,
} from '@shared/types';

export const institutionIntelligenceKeys = {
  all: ['institutionIntelligence'] as const,
  overview: () => [...institutionIntelligenceKeys.all, 'overview'] as const,
  skills: () => [...institutionIntelligenceKeys.all, 'skills'] as const,
  affectedStudents: (query: { skillId: string; page?: number; limit?: number; search?: string }) =>
    [...institutionIntelligenceKeys.all, 'affectedStudents', query] as const,
  interventions: () => [...institutionIntelligenceKeys.all, 'interventions'] as const,
  trends: () => [...institutionIntelligenceKeys.all, 'trends'] as const,
  aiRecommendations: () => [...institutionIntelligenceKeys.all, 'aiRecommendations'] as const,
};

export function useInstitutionOverview() {
  return useQuery({
    queryKey: institutionIntelligenceKeys.overview(),
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: InstitutionOverviewDto }>('/intelligence/institution/overview');
      return res.data;
    },
    staleTime: 30000,
  });
}

export function useInstitutionSkills() {
  return useQuery({
    queryKey: institutionIntelligenceKeys.skills(),
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: InstitutionSkillsResponse }>('/intelligence/institution/skills');
      return res.data;
    },
    staleTime: 60000,
  });
}

export function useInstitutionAffectedStudents(query: {
  skillId: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: institutionIntelligenceKeys.affectedStudents(query),
    queryFn: async () => {
      if (!query.skillId) throw new Error('Skill ID is required');
      const params = new URLSearchParams();
      params.set('skillId', query.skillId);
      if (query.page) params.set('page', String(query.page));
      if (query.limit) params.set('limit', String(query.limit));
      if (query.search) params.set('search', query.search);

      const res = await api.get<{ success: boolean; data: AffectedStudentsResponse }>(
        `/intelligence/institution/affected-students?${params.toString()}`
      );
      return res.data;
    },
    enabled: Boolean(query.skillId),
    staleTime: 30000,
  });
}

export function useInstitutionInterventions() {
  return useQuery({
    queryKey: institutionIntelligenceKeys.interventions(),
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: InstitutionInterventionsResponse }>(
        '/intelligence/institution/interventions'
      );
      return res.data;
    },
    staleTime: 60000,
  });
}

export function useInstitutionTrends() {
  return useQuery({
    queryKey: institutionIntelligenceKeys.trends(),
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: InstitutionTrendsDto }>('/intelligence/institution/trends');
      return res.data;
    },
    staleTime: 60000,
  });
}

export function useGenerateInstitutionAiRecommendations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<{ success: boolean; data: IntelligenceAiInsight }>(
        '/intelligence/institution/ai-recommendations',
        {}
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(institutionIntelligenceKeys.aiRecommendations(), data);
    },
  });
}
