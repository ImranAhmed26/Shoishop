'use client';

import { useShopContext } from '@/contexts/shop-context';
import { useShopOrders, useUpdateOrderStatus } from '@/hooks/use-orders';
import { OrderStatus } from '@/lib/types';
import { ORDER_STATUS_META } from '@/lib/order-status';

const STATUS_OPTIONS: OrderStatus[] = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

function formatPrice(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

export function OrdersManager() {
  const { shopId } = useShopContext();
  const { data: orders, isLoading } = useShopOrders(shopId);
  const updateStatus = useUpdateOrderStatus(shopId);

  if (!shopId) {
    return <p className="text-sm text-gray-500">No shop selected.</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading orders...</p>;
  }

  if (!orders || orders.length === 0) {
    return <p className="text-sm text-gray-500">No orders yet. New orders will appear here live.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="rounded border border-gray-200 p-3 text-sm dark:border-gray-800"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium">
                {order.guestName ?? 'Registered buyer'} · {formatPrice(order.totalCents, order.currency)}
              </p>
              <p className="text-xs text-gray-500">
                {order.shippingAddress}
                {order.shippingCity ? `, ${order.shippingCity}` : ''}
                {order.guestPhone ? ` · ${order.guestPhone}` : ''}
              </p>
              <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <select
              value={order.status}
              onChange={(e) =>
                updateStatus.mutate({ orderId: order.id, status: e.target.value as OrderStatus })
              }
              className={`rounded border px-2 py-1 text-xs font-medium ${ORDER_STATUS_META[order.status].selectClass}`}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {ORDER_STATUS_META[status].label}
                </option>
              ))}
            </select>
          </div>
          <ul className="mt-2 list-inside list-disc text-xs text-gray-600 dark:text-gray-400">
            {order.items.map((item) => (
              <li key={item.id}>
                {item.quantity}x {item.product?.title ?? item.productId} @{' '}
                {formatPrice(item.unitPriceCents, order.currency)}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
