'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/cart-context';
import { useCurrentUser } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { checkoutSchema, firstFieldError } from '@/lib/validation';

function formatPrice(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

export default function CheckoutPage() {
  const { items, clear } = useCart();
  const { data: user } = useCurrentUser();

  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);

  if (items.length === 0 && !placed) {
    return (
      <div className="mx-auto max-w-md px-4 py-8 text-center text-sm text-gray-500">
        Your cart is empty.
      </div>
    );
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-md px-4 py-8 text-center">
        <h1 className="text-xl font-semibold">Order placed!</h1>
        <p className="mt-2 text-sm text-gray-500">
          Thanks for your order. Payment is Cash on Delivery — pay when it arrives.
        </p>
      </div>
    );
  }

  const total = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  const currency = items[0]?.currency ?? 'BDT';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const result = checkoutSchema.safeParse({
      isGuest: !user,
      guestName,
      guestPhone,
      shippingAddress,
      shippingCity,
    });
    if (!result.success) {
      setError(firstFieldError(result.error));
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsByShop = new Map<string, typeof items>();
      for (const item of items) {
        const list = itemsByShop.get(item.shopId) ?? [];
        list.push(item);
        itemsByShop.set(item.shopId, list);
      }

      for (const [shopId, shopItems] of itemsByShop) {
        await api.post('/orders', {
          shopId,
          items: shopItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          shippingAddress,
          shippingCity: shippingCity || undefined,
          guestName: user ? undefined : guestName,
          guestPhone: user ? undefined : guestPhone,
        });
      }

      clear();
      setPlaced(true);
    } catch {
      setError('Could not place your order. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-4 text-xl font-semibold">Checkout</h1>
      <p className="mb-4 text-sm text-gray-500">Total: {formatPrice(total, currency)} · Cash on Delivery</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {!user && (
          <>
            <div className="flex flex-col">
              <label className="text-xs text-gray-500">Your name</label>
              <input
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-500">Phone number</label>
              <input
                required
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
              />
            </div>
          </>
        )}
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Shipping address</label>
          <input
            required
            minLength={5}
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">City</label>
          <input
            value={shippingCity}
            onChange={(e) => setShippingCity(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded bg-orange-600 hover:bg-orange-700 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Placing order...' : 'Place order (Cash on Delivery)'}
        </button>
      </form>
    </div>
  );
}
