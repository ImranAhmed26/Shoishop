'use client';

import Link from 'next/link';
import { useCurrentUser, useLogout } from '@/hooks/use-auth';

export function NavBar() {
  const { data: user, isLoading } = useCurrentUser();
  const logout = useLogout();

  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-base">
            🍼
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-lg font-bold text-brand-primary-dark">Shoishop</span>
            <span className="hidden text-[10px] tracking-wide text-gray-500 sm:block">
              For mom &amp; baby
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/">Home</Link>
          <Link href="/cart">Cart</Link>
          {!isLoading && user && <Link href="/orders">My orders</Link>}
          {!isLoading && user && (user.role === 'SHOP_OWNER' || user.role === 'ADMIN') && (
            <Link href="/dashboard">Dashboard</Link>
          )}
          {!isLoading && user?.role === 'ADMIN' && <Link href="/admin">Admin</Link>}
          {!isLoading && user ? (
            <button
              onClick={() => logout.mutate()}
              className="rounded bg-gray-100 px-3 py-1 dark:bg-gray-800"
            >
              Log out ({user.name})
            </button>
          ) : (
            !isLoading && (
              <>
                <Link href="/login">Log in</Link>
                <Link
                  href="/signup"
                  className="rounded bg-brand-primary px-3 py-1 text-white hover:bg-brand-primary-dark"
                >
                  Sign up
                </Link>
              </>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
