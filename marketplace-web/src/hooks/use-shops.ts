'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Shop } from '@/lib/types';

export function useMyShops() {
  return useQuery<Shop[]>({
    queryKey: ['shops', 'mine'],
    queryFn: async () => (await api.get<Shop[]>('/shops/mine')).data,
  });
}

export function useAllShopsAdmin() {
  return useQuery<Shop[]>({
    queryKey: ['shops', 'admin', 'all'],
    queryFn: async () => (await api.get<Shop[]>('/shops/admin/all')).data,
  });
}

export function useCreateShop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; slug: string; description?: string }) =>
      (await api.post<Shop>('/shops', input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
    },
  });
}

export function useUpdateShopStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ shopId, status }: { shopId: string; status: Shop['status'] }) =>
      (await api.patch<Shop>(`/shops/${shopId}`, { status })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
    },
  });
}
