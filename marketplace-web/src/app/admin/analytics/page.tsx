'use client';

import { useAdminAnalytics } from '@/hooks/use-admin';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';

function formatPrice(cents: number) {
  return `${(cents / 100).toFixed(2)} BDT`;
}

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useAdminAnalytics();

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="Analytics" />
        <p className="text-sm text-gray-500">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Analytics" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-gray-500">Shops</p>
          <p className="mt-1 text-2xl font-semibold">{data.shopCount}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Orders</p>
          <p className="mt-1 text-2xl font-semibold">{data.orderCount}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Revenue</p>
          <p className="mt-1 text-2xl font-semibold">{formatPrice(data.totalRevenueCents)}</p>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card title="Orders by status">
          <ul className="flex flex-col gap-1 text-sm">
            {data.ordersByStatus.map((row) => (
              <li key={row.status} className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">{row.status}</span>
                <span className="font-medium">{row.count}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Top products">
          <ul className="flex flex-col gap-1 text-sm">
            {data.topProducts.map((row) => (
              <li key={row.productId} className="flex items-center justify-between">
                <span className="truncate text-gray-600 dark:text-gray-400">{row.title}</span>
                <span className="font-medium">{row.unitsSold} sold</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
