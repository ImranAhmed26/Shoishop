'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { api, API_URL } from '@/lib/api';
import { Order, OrderStatus } from '@/lib/types';

let socket: Socket | null = null;

function getSocket() {
  if (!socket) {
    socket = io(API_URL, { withCredentials: true, transports: ['websocket', 'polling'] });
  }
  return socket;
}

export function useShopOrders(shopId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['shops', shopId, 'orders'];

  const query = useQuery<Order[]>({
    queryKey,
    queryFn: async () => (await api.get<Order[]>(`/shops/${shopId}/orders`)).data,
    enabled: !!shopId,
  });

  useEffect(() => {
    if (!shopId) return;
    const s = getSocket();

    function upsertOrder(order: Order) {
      if (order.shopId !== shopId) return;
      queryClient.setQueryData<Order[]>(queryKey, (current) => {
        if (!current) return current;
        const exists = current.some((o) => o.id === order.id);
        return exists
          ? current.map((o) => (o.id === order.id ? order : o))
          : [order, ...current];
      });
    }

    s.on('order.created', upsertOrder);
    s.on('order.updated', upsertOrder);

    return () => {
      s.off('order.created', upsertOrder);
      s.off('order.updated', upsertOrder);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  return query;
}

export function useUpdateOrderStatus(shopId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      (await api.patch<Order>(`/shops/${shopId}/orders/${orderId}/status`, { status })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops', shopId, 'orders'] });
    },
  });
}
