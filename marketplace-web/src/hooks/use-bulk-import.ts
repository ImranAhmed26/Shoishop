'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface BulkImportFailure {
  row: number;
  reason: string;
}

export interface BulkImportSummary {
  imported: number;
  failed: BulkImportFailure[];
}

export function useBulkImportProducts(shopId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return (
        await api.post<BulkImportSummary>(`/shops/${shopId}/products/bulk-import`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops', shopId, 'products'] });
    },
  });
}
