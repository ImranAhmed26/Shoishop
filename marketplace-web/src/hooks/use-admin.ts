'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface AdminAnalytics {
  shopCount: number;
  orderCount: number;
  totalRevenueCents: number;
  ordersByStatus: { status: string; count: number }[];
  topProducts: { productId: string; title: string; unitsSold: number }[];
}

export function useAdminAnalytics() {
  return useQuery<AdminAnalytics>({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => (await api.get<AdminAnalytics>('/admin/analytics')).data,
  });
}
