'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Product, Shop } from '@/lib/types';

export function useShopBySlug(slug: string) {
  return useQuery<Shop>({
    queryKey: ['shops', 'by-slug', slug],
    queryFn: async () => (await api.get<Shop>(`/shops/by-slug/${slug}`)).data,
    retry: false,
  });
}

export interface PublicProductsPage {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export function usePublicProducts(
  filters: { shop?: string; category?: string; page?: number; pageSize?: number } = {},
) {
  return useQuery<PublicProductsPage>({
    queryKey: ['products', filters],
    queryFn: async () => (await api.get<PublicProductsPage>('/products', { params: filters })).data,
  });
}

export function usePublicProduct(productId: string) {
  return useQuery<Product>({
    queryKey: ['products', productId],
    queryFn: async () => (await api.get<Product>(`/products/${productId}`)).data,
    retry: false,
  });
}
