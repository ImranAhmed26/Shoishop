'use client';

import { usePathname } from 'next/navigation';
import { NavBar } from './nav-bar';

export function ConditionalNavBar() {
  const pathname = usePathname();
  const isAppShell = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin');
  if (isAppShell) {
    return null;
  }
  return <NavBar />;
}
