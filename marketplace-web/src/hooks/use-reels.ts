'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Reel, ReelStatus } from '@/lib/types';

interface ReelsFeedPage {
  items: Reel[];
  nextCursor: string | null;
}

export function useReelsFeed() {
  return useInfiniteQuery<ReelsFeedPage>({
    queryKey: ['reels', 'feed'],
    queryFn: async ({ pageParam }) =>
      (
        await api.get<ReelsFeedPage>('/reels/feed', {
          params: pageParam ? { cursor: pageParam } : undefined,
        })
      ).data,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useRegisterReelView() {
  return useMutation({
    mutationFn: async (reelId: string) => api.post(`/reels/${reelId}/view`),
  });
}

export function useShopReels(shopId: string | null) {
  return useQuery<Reel[]>({
    queryKey: ['shops', shopId, 'reels'],
    queryFn: async () => (await api.get<Reel[]>(`/shops/${shopId}/reels`)).data,
    enabled: !!shopId,
  });
}

interface ReelInput {
  videoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  linkedProductId?: string;
}

export function useCreateReel(shopId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReelInput) =>
      (await api.post<Reel>(`/shops/${shopId}/reels`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops', shopId, 'reels'] });
    },
  });
}

interface ReelUpdateInput {
  reelId: string;
  caption?: string;
  thumbnailUrl?: string;
  linkedProductId?: string | null;
  status?: ReelStatus;
}

export function useUpdateReel(shopId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reelId, ...input }: ReelUpdateInput) =>
      (await api.patch<Reel>(`/shops/${shopId}/reels/${reelId}`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops', shopId, 'reels'] });
    },
  });
}

export function useDeleteReel(shopId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reelId: string) => api.delete(`/shops/${shopId}/reels/${reelId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops', shopId, 'reels'] });
    },
  });
}
