'use client';

import Link from 'next/link';
import { useCurrentUser, useLogout } from '@/hooks/use-auth';

export function NavBar() {
  const { data: user, isLoading } = useCurrentUser();
  const logout = useLogout();

  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">
          Marketplace
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
                <Link href="/signup" className="rounded bg-orange-600 hover:bg-orange-700 px-3 py-1 text-white">
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
