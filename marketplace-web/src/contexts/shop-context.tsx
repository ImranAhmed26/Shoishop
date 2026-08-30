'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Shop } from '@/lib/types';

interface ShopContextValue {
  shops: Shop[];
  shopId: string | null;
  setShopId: (id: string) => void;
  isAdminView: boolean;
}

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({
  shops,
  isAdminView,
  children,
}: {
  shops: Shop[];
  isAdminView: boolean;
  children: React.ReactNode;
}) {
  const [shopId, setShopId] = useState<string | null>(shops[0]?.id ?? null);

  useEffect(() => {
    if (!shopId && shops.length > 0) {
      setShopId(shops[0].id);
    }
  }, [shops, shopId]);

  const value = useMemo(
    () => ({ shops, shopId, setShopId, isAdminView }),
    [shops, shopId, isAdminView],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShopContext() {
  const ctx = useContext(ShopContext);
  if (!ctx) {
    throw new Error('useShopContext must be used within a ShopProvider');
  }
  return ctx;
}
