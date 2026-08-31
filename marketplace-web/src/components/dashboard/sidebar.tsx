'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCurrentUser, useLogout } from '@/hooks/use-auth';
import { IconLogout } from './icons';

export interface SidebarItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function Sidebar({ items, homeHref }: { items: SidebarItem[]; homeHref: string }) {
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <Link href={homeHref} className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-base">
          🍼
        </span>
        <span className="text-lg font-bold text-brand-primary-dark">Shoishop</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-primary/10 text-brand-primary-dark'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 px-4 py-4 dark:border-gray-800">
        <p className="truncate text-sm font-medium">{user?.name}</p>
        <p className="truncate text-xs text-gray-500">{user?.email}</p>
        <button
          onClick={() => logout.mutate()}
          className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600"
        >
          <IconLogout className="h-3.5 w-3.5" />
          Log out
        </button>
      </div>
    </aside>
  );
}
