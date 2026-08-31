'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-auth';
import { useMyShops } from '@/hooks/use-shops';
import { ShopProvider } from '@/contexts/shop-context';
import { ShopSwitcher } from '@/components/dashboard/shop-switcher';
import { CreateShopForm } from '@/components/dashboard/create-shop-form';
import { Sidebar } from '@/components/dashboard/sidebar';
import { IconBox, IconReceipt, IconFilm } from '@/components/dashboard/icons';

const NAV_ITEMS = [
  { href: '/dashboard/orders', label: 'Orders', icon: <IconReceipt /> },
  { href: '/dashboard/products', label: 'Products', icon: <IconBox /> },
  { href: '/dashboard/reels', label: 'Reels', icon: <IconFilm /> },
];

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
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar items={NAV_ITEMS} homeHref="/" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-end border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-800 dark:bg-gray-900">
            <ShopSwitcher />
          </div>
          <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        </div>
      </div>
    </ShopProvider>
  );
}
