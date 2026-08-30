'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-auth';
import { useAllShopsAdmin } from '@/hooks/use-shops';
import { ShopProvider } from '@/contexts/shop-context';
import { ShopSwitcher } from '@/components/dashboard/shop-switcher';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: shops, isLoading: shopsLoading } = useAllShopsAdmin();

  useEffect(() => {
    if (!userLoading && (!user || user.role !== 'ADMIN')) {
      router.replace('/login');
    }
  }, [user, userLoading, router]);

  if (userLoading || shopsLoading || !user || user.role !== 'ADMIN') {
    return <div className="px-4 py-16 text-center text-sm text-gray-500">Loading...</div>;
  }

  if (!shops || shops.length === 0) {
    return (
      <div className="px-4 py-16 text-center text-sm text-gray-500">
        No shops on the platform yet.
      </div>
    );
  }

  return (
    <ShopProvider shops={shops} isAdminView>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <nav className="flex gap-4 text-sm">
            <Link href="/admin/products">Products</Link>
            <Link href="/admin/orders">Orders</Link>
            <Link href="/admin/reels">Reels</Link>
          </nav>
          <ShopSwitcher />
        </div>
        {children}
      </div>
    </ShopProvider>
  );
}
