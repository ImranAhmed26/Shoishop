'use client';

import { useShopContext } from '@/contexts/shop-context';

export function ShopSwitcher() {
  const { shops, shopId, setShopId, isAdminView } = useShopContext();

  if (shops.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {isAdminView && <span className="text-gray-500">Managing shop:</span>}
      <select
        value={shopId ?? ''}
        onChange={(e) => setShopId(e.target.value)}
        className="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
      >
        {shops.map((shop) => (
          <option key={shop.id} value={shop.id}>
            {shop.name}
            {shop.status !== 'ACTIVE' ? ` (${shop.status})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
