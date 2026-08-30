'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export interface CartItem {
  productId: string;
  shopId: string;
  title: string;
  priceCents: number;
  currency: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'marketplace_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {
        // ignore corrupt cart storage
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      addItem: (item, quantity = 1) => {
        setItems((current) => {
          const existing = current.find((i) => i.productId === item.productId);
          if (existing) {
            return current.map((i) =>
              i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i,
            );
          }
          return [...current, { ...item, quantity }];
        });
      },
      updateQuantity: (productId, quantity) => {
        setItems((current) =>
          quantity <= 0
            ? current.filter((i) => i.productId !== productId)
            : current.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        );
      },
      removeItem: (productId) => {
        setItems((current) => current.filter((i) => i.productId !== productId));
      },
      clear: () => setItems([]),
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
