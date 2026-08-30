'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Product, ProductStatus } from '@/lib/types';

export function useShopProducts(shopId: string | null) {
  return useQuery<Product[]>({
    queryKey: ['shops', shopId, 'products'],
    queryFn: async () => (await api.get<Product[]>(`/shops/${shopId}/products`)).data,
    enabled: !!shopId,
  });
}

interface ProductInput {
  title: string;
  description?: string;
  priceCents: number;
  stockQty?: number;
  categoryId?: string;
  images?: string[];
  status?: ProductStatus;
}

export function useCreateProduct(shopId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProductInput) =>
      (await api.post<Product>(`/shops/${shopId}/products`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops', shopId, 'products'] });
    },
  });
}

export function useUpdateProduct(shopId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, ...input }: Partial<ProductInput> & { productId: string }) =>
      (await api.patch<Product>(`/shops/${shopId}/products/${productId}`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops', shopId, 'products'] });
    },
  });
}

export function useDeleteProduct(shopId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) =>
      api.delete(`/shops/${shopId}/products/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops', shopId, 'products'] });
    },
  });
}
