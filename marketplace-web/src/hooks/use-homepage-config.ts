'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { HomepageConfig, HomepageLinkType } from '@/lib/types';

export function useAdminHomepageConfig() {
  return useQuery<HomepageConfig>({
    queryKey: ['admin', 'homepage-config'],
    queryFn: async () => (await api.get<HomepageConfig>('/admin/homepage-config')).data,
  });
}

export function useUpdateHeroImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (heroImageUrl: string | null) =>
      (await api.patch<HomepageConfig>('/admin/homepage-config/hero', { heroImageUrl })).data,
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'homepage-config'], data);
    },
  });
}

export function useAddHomepageLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { type: HomepageLinkType; categoryId?: string; brandId?: string }) =>
      (await api.post<HomepageConfig>('/admin/homepage-config/links', input)).data,
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'homepage-config'], data);
    },
  });
}

export function useRemoveHomepageLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) =>
      (await api.delete<HomepageConfig>(`/admin/homepage-config/links/${linkId}`)).data,
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'homepage-config'], data);
    },
  });
}

export function useMoveHomepageLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ linkId, direction }: { linkId: string; direction: 'up' | 'down' }) =>
      (
        await api.patch<HomepageConfig>(`/admin/homepage-config/links/${linkId}/move`, {
          direction,
        })
      ).data,
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'homepage-config'], data);
    },
  });
}
