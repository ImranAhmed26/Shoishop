'use client';

import Link from 'next/link';
import { useCart } from '@/contexts/cart-context';

function formatPrice(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

export default function CartPage() {
  const { items, updateQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-sm text-gray-500">Your cart is empty.</p>
        <Link href="/" className="mt-2 inline-block text-sm underline">
          Continue browsing
        </Link>
      </div>
    );
  }

  const total = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  const currency = items[0]?.currency ?? 'BDT';

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-xl font-semibold">Your cart</h1>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center justify-between rounded border border-gray-200 p-3 text-sm dark:border-gray-800"
          >
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-gray-500">{formatPrice(item.priceCents, item.currency)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value, 10) || 0)}
                className="w-16 rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
              />
              <button
                onClick={() => removeItem(item.productId)}
                className="text-xs text-red-600 underline"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <p className="text-lg font-medium">Total: {formatPrice(total, currency)}</p>
        <Link href="/checkout" className="rounded bg-orange-600 hover:bg-orange-700 px-4 py-2 text-sm text-white">
          Checkout
        </Link>
      </div>
    </div>
  );
}
