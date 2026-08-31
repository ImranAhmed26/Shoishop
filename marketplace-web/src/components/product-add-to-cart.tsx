'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/cart-context';
import { Product } from '@/lib/types';

export function ProductAddToCart({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    addItem({
      productId: product.id,
      shopId: product.shopId,
      title: product.title,
      priceCents: product.priceCents,
      currency: product.currency,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={product.stockQty <= 0}
      className="mt-4 rounded bg-brand-primary hover:bg-brand-primary-dark px-4 py-2 text-sm text-white disabled:opacity-50"
    >
      {added ? 'Added!' : 'Add to cart'}
    </button>
  );
}
