import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  CollaborationSummaryDto,
  CollaborationDetailDto,
  CreateCollaborationInput,
  UpdateCollaborationStatusInput,
  SendCollaborationMessageInput,
  CollaborationPartnersResponse,
  CollaborationMessageDto,
} from '@shared/types';

// Query keys
export const collaborationKeys = {
  all: ['collaborations'] as const,
  lists: () => [...collaborationKeys.all, 'list'] as const,
  list: (status?: string) => [...collaborationKeys.lists(), { status }] as const,
  details: () => [...collaborationKeys.all, 'detail'] as const,
  detail: (id: string) => [...collaborationKeys.details(), id] as const,
  partners: () => [...collaborationKeys.all, 'partners'] as const,
};

/**
 * Fetch all collaborations visible to the authenticated user's role.
 */
export function useCollaborations(status?: string) {
  return useQuery({
    queryKey: collaborationKeys.list(status),
    queryFn: async () => {
      const queryParam = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : '';
      const res = await api.get<{ collaborations: CollaborationSummaryDto[] }>(`/collaborations${queryParam}`);
      return res.collaborations;
    },
    staleTime: 30000,
  });
}

/**
 * Fetch a single collaboration by ID with full messages history.
 */
export function useCollaboration(id?: string) {
  return useQuery({
    queryKey: collaborationKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Collaboration ID is required');
      const res = await api.get<{ collaboration: CollaborationDetailDto }>(`/collaborations/${id}`);
      return res.collaboration;
    },
    enabled: Boolean(id),
    staleTime: 10000,
    refetchInterval: 15000, // Background polling for live messages
  });
}

/**
 * Fetch potential partners (Institutions for Industry, Companies for Institution Admins).
 */
export function useCollaborationPartners() {
  return useQuery({
    queryKey: collaborationKeys.partners(),
    queryFn: async () => {
      const res = await api.get<CollaborationPartnersResponse>('/collaborations/partners');
      return res;
    },
    staleTime: 60000,
  });
}

/**
 * Create a new collaboration proposal.
 */
export function useCreateCollaboration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCollaborationInput) => {
      const res = await api.post<{ message: string; collaboration: CollaborationDetailDto }>('/collaborations', payload);
      return res.collaboration;
    },
    onSuccess: (newCollab) => {
      queryClient.invalidateQueries({ queryKey: collaborationKeys.lists() });
      if (newCollab?.id) {
        queryClient.setQueryData(collaborationKeys.detail(newCollab.id), newCollab);
      }
    },
  });
}

/**
 * Update the status of an existing collaboration.
 */
export function useUpdateCollaborationStatus(collaborationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateCollaborationStatusInput) => {
      const res = await api.patch<{ message: string; collaboration: CollaborationDetailDto }>(
        `/collaborations/${collaborationId}/status`,
        payload
      );
      return res.collaboration;
    },
    onSuccess: (updatedCollab) => {
      queryClient.invalidateQueries({ queryKey: collaborationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: collaborationKeys.detail(collaborationId) });
      if (updatedCollab) {
        queryClient.setQueryData(collaborationKeys.detail(collaborationId), updatedCollab);
      }
    },
  });
}

/**
 * Post a new message in a collaboration negotiation thread.
 */
export function useSendCollaborationMessage(collaborationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SendCollaborationMessageInput) => {
      const res = await api.post<{ message: CollaborationMessageDto }>(
        `/collaborations/${collaborationId}/messages`,
        payload
      );
      return res.message;
    },
    onSuccess: (newMessage) => {
      queryClient.invalidateQueries({ queryKey: collaborationKeys.detail(collaborationId) });
      queryClient.invalidateQueries({ queryKey: collaborationKeys.lists() });
    },
  });
}
