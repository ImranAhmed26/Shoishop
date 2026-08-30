'use client';

import { useAdminAnalytics } from '@/hooks/use-admin';

function formatPrice(cents: number) {
  return `${(cents / 100).toFixed(2)} BDT`;
}

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useAdminAnalytics();

  if (isLoading || !data) {
    return <p className="text-sm text-gray-500">Loading analytics...</p>;
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Analytics</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Shops</p>
          <p className="mt-1 text-2xl font-semibold">{data.shopCount}</p>
        </div>
        <div className="rounded border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Orders</p>
          <p className="mt-1 text-2xl font-semibold">{data.orderCount}</p>
        </div>
        <div className="rounded border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Revenue</p>
          <p className="mt-1 text-2xl font-semibold">{formatPrice(data.totalRevenueCents)}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold">Orders by status</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {data.ordersByStatus.map((row) => (
              <li key={row.status} className="flex items-center justify-between">
                <span className="text-gray-600">{row.status}</span>
                <span className="font-medium">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold">Top products</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {data.topProducts.map((row) => (
              <li key={row.productId} className="flex items-center justify-between">
                <span className="truncate text-gray-600">{row.title}</span>
                <span className="font-medium">{row.unitsSold} sold</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
