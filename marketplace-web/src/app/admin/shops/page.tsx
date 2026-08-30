'use client';

import { useAllShopsAdmin, useUpdateShopStatus } from '@/hooks/use-shops';
import { ShopStatus } from '@/lib/types';

const STATUS_OPTIONS: ShopStatus[] = ['ACTIVE', 'SUSPENDED', 'PENDING'];

export default function AdminShopsPage() {
  const { data: shops, isLoading } = useAllShopsAdmin();
  const updateStatus = useUpdateShopStatus();

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading shops...</p>;
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Shops</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="py-2">Name</th>
            <th className="py-2">Slug</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {shops?.map((shop) => (
            <tr key={shop.id} className="border-b border-gray-100">
              <td className="py-2">{shop.name}</td>
              <td className="py-2 text-gray-500">{shop.slug}</td>
              <td className="py-2">
                <select
                  value={shop.status}
                  onChange={(e) =>
                    updateStatus.mutate({
                      shopId: shop.id,
                      status: e.target.value as ShopStatus,
                    })
                  }
                  className="rounded border border-gray-300 px-1 py-0.5 text-xs"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
