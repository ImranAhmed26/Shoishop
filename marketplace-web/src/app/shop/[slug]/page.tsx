'use client';

import { use } from 'react';
import Link from 'next/link';
import { useShopBySlug, usePublicProducts } from '@/hooks/use-storefront';

function formatPrice(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

export default function ShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: shop, isLoading: shopLoading, isError: shopError } = useShopBySlug(slug);
  const { data: productsPage, isLoading: productsLoading } = usePublicProducts({ shop: slug });
  const products = productsPage?.items;

  if (shopLoading) {
    return <p className="mx-auto max-w-7xl px-4 py-8 text-sm text-gray-500">Loading shop...</p>;
  }

  if (shopError || !shop) {
    return <p className="mx-auto max-w-7xl px-4 py-8 text-sm text-gray-500">Shop not found.</p>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-semibold">{shop.name}</h1>
      {shop.description && <p className="mt-1 text-sm text-gray-500">{shop.description}</p>}

      <div className="mt-6">
        {productsLoading ? (
          <p className="text-sm text-gray-500">Loading products...</p>
        ) : products?.length === 0 ? (
          <p className="text-sm text-gray-500">No products available yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {products?.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="rounded border border-gray-200 p-3 text-sm hover:border-gray-400 dark:border-gray-800"
              >
                <div className="aspect-square rounded bg-gray-100 dark:bg-gray-900" />
                <p className="mt-2 truncate font-medium">{product.title}</p>
                <p className="text-gray-500">{formatPrice(product.priceCents, product.currency)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
