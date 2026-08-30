import Link from 'next/link';
import type { Metadata } from 'next';
import { ReelsFeed } from '@/components/reels/reels-feed';
import { API_URL } from '@/lib/api';
import { Product } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Shoishop — Shop from local vendors',
  description:
    'Discover products from independent shops on Shoishop, a multi-vendor marketplace. Browse the latest listings and shop directly from local sellers.',
  openGraph: {
    title: 'Shoishop — Shop from local vendors',
    description:
      'Discover products from independent shops on Shoishop, a multi-vendor marketplace.',
    type: 'website',
  },
};

interface PublicProductsPage {
  items: Product[];
  total: number;
}

async function getHomepageProducts(): Promise<PublicProductsPage> {
  try {
    const res = await fetch(`${API_URL}/products?pageSize=24`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return { items: [], total: 0 };
    }
    const data = await res.json();
    return { items: data.items ?? [], total: data.total ?? 0 };
  } catch {
    return { items: [], total: 0 };
  }
}

function formatPrice(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

export default async function Home() {
  const { items: products } = await getHomepageProducts();

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/product/${product.id}`,
      item: {
        '@type': 'Product',
        name: product.title,
        description: product.description ?? undefined,
        offers: {
          '@type': 'Offer',
          price: (product.priceCents / 100).toFixed(2),
          priceCurrency: product.currency,
          availability:
            product.stockQty > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
        },
      },
    })),
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <ReelsFeed />

      <div className="mt-8">
        <h1 className="text-lg font-semibold">Latest products</h1>

        {products.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No products available yet.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="rounded border border-gray-200 p-3 text-sm hover:border-gray-400"
              >
                <div className="aspect-square overflow-hidden rounded bg-gray-100">
                  {product.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
                <p className="mt-2 truncate font-medium">{product.title}</p>
                <p className="text-gray-500">{formatPrice(product.priceCents, product.currency)}</p>
                {product.shop && (
                  <p className="mt-0.5 truncate text-xs text-gray-400">{product.shop.name}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
