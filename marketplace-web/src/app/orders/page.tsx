'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/hooks/use-auth';
import { useMyOrders } from '@/hooks/use-orders';

function formatPrice(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

export default function OrdersPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: orders, isLoading: ordersLoading } = useMyOrders();

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace('/login');
    }
  }, [user, userLoading, router]);

  if (userLoading || !user || ordersLoading) {
    return <p className="mx-auto max-w-3xl px-4 py-8 text-sm text-gray-500">Loading orders...</p>;
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 text-center text-sm text-gray-500">
        You haven&apos;t placed any orders yet.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-xl font-semibold">My orders</h1>
      <div className="flex flex-col gap-3">
        {orders.map((order) => (
          <div key={order.id} className="rounded border border-gray-200 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">
                  {order.shop?.name ?? 'Shop'} · {formatPrice(order.totalCents, order.currency)}
                </p>
                <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium">
                {order.status}
              </span>
            </div>
            <ul className="mt-2 flex flex-col gap-1 text-xs text-gray-600">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between">
                  <span>
                    {item.quantity}x{' '}
                    {item.product ? (
                      <Link href={`/product/${item.product.id}`} className="underline">
                        {item.product.title}
                      </Link>
                    ) : (
                      item.productId
                    )}
                  </span>
                  <span>{formatPrice(item.unitPriceCents, order.currency)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
