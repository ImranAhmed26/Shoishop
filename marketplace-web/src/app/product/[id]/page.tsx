'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { usePublicProduct } from '@/hooks/use-storefront';
import { useCart } from '@/contexts/cart-context';
import { ProductReviews } from '@/components/product-reviews';

function formatPrice(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: product, isLoading, isError } = usePublicProduct(id);
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  if (isLoading) {
    return <p className="mx-auto max-w-3xl px-4 py-8 text-sm text-gray-500">Loading product...</p>;
  }

  if (isError || !product) {
    return <p className="mx-auto max-w-3xl px-4 py-8 text-sm text-gray-500">Product not found.</p>;
  }

  function handleAddToCart() {
    if (!product) return;
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      {product.shop && (
        <Link href={`/shop/${product.shop.slug}`} className="text-xs text-gray-500 underline">
          {product.shop.name}
        </Link>
      )}
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <div className="aspect-square rounded bg-gray-100 dark:bg-gray-900" />
        <div>
          <h1 className="text-xl font-semibold">{product.title}</h1>
          {product.reviewCount ? (
            <p className="mt-1 text-sm text-orange-600">
              {'★'.repeat(Math.round(product.avgRating ?? 0))}
              {'☆'.repeat(5 - Math.round(product.avgRating ?? 0))}{' '}
              <span className="text-gray-500">
                {product.avgRating?.toFixed(1)} ({product.reviewCount} review
                {product.reviewCount === 1 ? '' : 's'})
              </span>
            </p>
          ) : null}
          <p className="mt-1 text-lg">{formatPrice(product.priceCents, product.currency)}</p>
          {product.description && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{product.description}</p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            {product.stockQty > 0 ? `${product.stockQty} in stock` : 'Out of stock'}
          </p>
          <button
            onClick={handleAddToCart}
            disabled={product.stockQty <= 0}
            className="mt-4 rounded bg-orange-600 hover:bg-orange-700 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {added ? 'Added!' : 'Add to cart'}
          </button>
        </div>
      </div>
      <ProductReviews productId={product.id} />
    </div>
  );
}
