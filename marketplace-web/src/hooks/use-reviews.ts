'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Review } from '@/lib/types';

export function useProductReviews(productId: string) {
  return useQuery<Review[]>({
    queryKey: ['products', productId, 'reviews'],
    queryFn: async () => (await api.get<Review[]>(`/products/${productId}/reviews`)).data,
  });
}

export function useCreateReview(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { rating: number; comment?: string }) =>
      (await api.post<Review>(`/products/${productId}/reviews`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', productId, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['products', productId] });
    },
  });
}
