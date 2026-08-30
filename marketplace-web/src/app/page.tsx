import Link from 'next/link';
import type { Metadata } from 'next';
import { ReelsFeed } from '@/components/reels/reels-feed';
import { API_URL } from '@/lib/api';
import { Product, Category } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Shoishop — Everything for Mom & Baby',
  description:
    'Shoishop is a marketplace for mom & baby essentials — diapers, feeding, nursery, maternity wear, and more — from independent local shops.',
  openGraph: {
    title: 'Shoishop — Everything for Mom & Baby',
    description:
      'Shop mom & baby essentials from independent local shops, all in one place.',
    type: 'website',
  },
};

interface PublicProductsPage {
  items: Product[];
  total: number;
}

interface HomeSearchParams {
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}

async function getHomepageProducts(searchParams: HomeSearchParams): Promise<PublicProductsPage> {
  try {
    const params = new URLSearchParams({ pageSize: '24' });
    if (searchParams.q) params.set('q', searchParams.q);
    if (searchParams.minPrice) params.set('minPrice', searchParams.minPrice);
    if (searchParams.maxPrice) params.set('maxPrice', searchParams.maxPrice);
    if (searchParams.sort) params.set('sort', searchParams.sort);

    const res = await fetch(`${API_URL}/products?${params.toString()}`, {
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

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function formatPrice(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const [{ items: products }, categories] = await Promise.all([
    getHomepageProducts(resolvedSearchParams),
    getCategories(),
  ]);
  const isFiltered = Boolean(
    resolvedSearchParams.q ||
      resolvedSearchParams.minPrice ||
      resolvedSearchParams.maxPrice ||
      (resolvedSearchParams.sort && resolvedSearchParams.sort !== 'newest'),
  );

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
    <div>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <section className="bg-brand-cream">
        <div className="mx-auto max-w-7xl px-4 py-10 text-center sm:py-14">
          <p className="text-3xl sm:text-4xl" aria-hidden="true">
            🤰 🍼 👶
          </p>
          <h1 className="mt-3 text-2xl font-bold text-brand-primary-dark sm:text-3xl">
            Shoishop
          </h1>
          <p className="mt-1 text-sm text-brand-ink sm:text-base">
            Everything for mom &amp; baby, from local shops you can trust.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <ReelsFeed />

        {categories.length > 0 && (
          <nav aria-label="Categories" className="mt-6 flex flex-wrap gap-2 text-sm">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="rounded-full border border-brand-secondary bg-white px-3 py-1 text-brand-ink hover:bg-brand-secondary/20"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        )}

        <div className="mt-8">
          <h2 className="text-lg font-semibold">Latest products</h2>

        <form method="GET" className="mt-3 flex flex-wrap items-end gap-3 text-sm">
          <div className="flex flex-col">
            <label htmlFor="q" className="text-xs text-gray-500">
              Search
            </label>
            <input
              id="q"
              name="q"
              defaultValue={resolvedSearchParams.q ?? ''}
              placeholder="Search products..."
              className="rounded border border-gray-300 px-2 py-1"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="minPrice" className="text-xs text-gray-500">
              Min price
            </label>
            <input
              id="minPrice"
              name="minPrice"
              type="number"
              min="0"
              step="0.01"
              defaultValue={resolvedSearchParams.minPrice ?? ''}
              className="w-24 rounded border border-gray-300 px-2 py-1"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="maxPrice" className="text-xs text-gray-500">
              Max price
            </label>
            <input
              id="maxPrice"
              name="maxPrice"
              type="number"
              min="0"
              step="0.01"
              defaultValue={resolvedSearchParams.maxPrice ?? ''}
              className="w-24 rounded border border-gray-300 px-2 py-1"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="sort" className="text-xs text-gray-500">
              Sort by
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={resolvedSearchParams.sort ?? 'newest'}
              className="rounded border border-gray-300 px-2 py-1"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </div>
          <button
            type="submit"
            className="rounded bg-brand-primary px-3 py-1.5 text-white hover:bg-brand-primary-dark"
          >
            Apply
          </button>
          {isFiltered && (
            <Link href="/" className="text-xs text-gray-500 underline">
              Clear filters
            </Link>
          )}
        </form>

        {products.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            {isFiltered ? 'No products match your filters.' : 'No products available yet.'}
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="overflow-hidden rounded border border-gray-200 text-sm hover:border-brand-primary"
              >
                <div className="aspect-square overflow-hidden bg-gray-100">
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
                <div className="px-1.5 py-1">
                  <p className="truncate font-medium">{product.title}</p>
                  <p className="text-gray-500">{formatPrice(product.priceCents, product.currency)}</p>
                  {product.shop && (
                    <p className="truncate text-xs text-gray-400">{product.shop.name}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
