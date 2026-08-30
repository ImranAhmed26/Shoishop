'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-auth';
import { useMyShops } from '@/hooks/use-shops';
import { ShopProvider } from '@/contexts/shop-context';
import { ShopSwitcher } from '@/components/dashboard/shop-switcher';
import { CreateShopForm } from '@/components/dashboard/create-shop-form';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: shops, isLoading: shopsLoading } = useMyShops();

  useEffect(() => {
    if (!userLoading && (!user || (user.role !== 'SHOP_OWNER' && user.role !== 'ADMIN'))) {
      router.replace('/login');
    }
  }, [user, userLoading, router]);

  if (userLoading || shopsLoading || !user) {
    return <div className="px-4 py-16 text-center text-sm text-gray-500">Loading...</div>;
  }

  if (!shops || shops.length === 0) {
    return <CreateShopForm />;
  }

  return (
    <ShopProvider shops={shops} isAdminView={false}>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <nav className="flex gap-4 text-sm">
            <Link href="/dashboard/products">Products</Link>
            <Link href="/dashboard/orders">Orders</Link>
            <Link href="/dashboard/reels">Reels</Link>
          </nav>
          <ShopSwitcher />
        </div>
        {children}
      </div>
    </ShopProvider>
  );
}
