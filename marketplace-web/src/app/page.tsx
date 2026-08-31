import Link from 'next/link';
import type { Metadata } from 'next';
import { API_URL } from '@/lib/api';
import { Product, HomepageConfig } from '@/lib/types';

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

const PAGE_SIZE = 24;

interface PublicProductsPage {
  items: Product[];
  total: number;
  page: number;
}

interface HomeSearchParams {
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
}

async function getHomepageProducts(searchParams: HomeSearchParams): Promise<PublicProductsPage> {
  try {
    const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
    const params = new URLSearchParams({ pageSize: String(PAGE_SIZE), page: String(page) });
    if (searchParams.q) params.set('q', searchParams.q);
    if (searchParams.minPrice) params.set('minPrice', searchParams.minPrice);
    if (searchParams.maxPrice) params.set('maxPrice', searchParams.maxPrice);
    if (searchParams.sort) params.set('sort', searchParams.sort);

    const res = await fetch(`${API_URL}/products?${params.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return { items: [], total: 0, page };
    }
    const data = await res.json();
    return { items: data.items ?? [], total: data.total ?? 0, page };
  } catch {
    return { items: [], total: 0, page: 1 };
  }
}

async function getHomepageConfig(): Promise<HomepageConfig> {
  try {
    const res = await fetch(`${API_URL}/homepage-config`, { next: { revalidate: 30 } });
    if (!res.ok) return { heroImageUrl: null, links: [] };
    return await res.json();
  } catch {
    return { heroImageUrl: null, links: [] };
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
  const [{ items: products, total, page }, homepageConfig] = await Promise.all([
    getHomepageProducts(resolvedSearchParams),
    getHomepageConfig(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(targetPage: number) {
    const params = new URLSearchParams();
    if (resolvedSearchParams.q) params.set('q', resolvedSearchParams.q);
    if (resolvedSearchParams.minPrice) params.set('minPrice', resolvedSearchParams.minPrice);
    if (resolvedSearchParams.maxPrice) params.set('maxPrice', resolvedSearchParams.maxPrice);
    if (resolvedSearchParams.sort) params.set('sort', resolvedSearchParams.sort);
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return qs ? `/?${qs}` : '/';
  }
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

      <section
        className="bg-brand-cream bg-cover bg-center"
        style={homepageConfig.heroImageUrl ? { backgroundImage: `url(${homepageConfig.heroImageUrl})` } : undefined}
      >
        <div
          className={`mx-auto max-w-7xl px-4 py-10 text-center sm:py-14 ${
            homepageConfig.heroImageUrl ? 'rounded-lg bg-white/80 backdrop-blur-sm dark:bg-black/50' : ''
          }`}
        >
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
        {/* Reels temporarily hidden on the homepage until that feature is revisited. */}

        {homepageConfig.links.length > 0 && (
          <nav aria-label="Shop by category or brand" className="mt-6 flex flex-wrap gap-2 text-sm">
            {homepageConfig.links.map((link) =>
              link.slug ? (
                <Link
                  key={link.id}
                  href={link.type === 'CATEGORY' ? `/category/${link.slug}` : `/brand/${link.slug}`}
                  className="rounded-full border border-brand-secondary bg-white px-3 py-1 text-brand-ink hover:bg-brand-secondary/20"
                >
                  {link.label}
                </Link>
              ) : null,
            )}
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

        {totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-3 text-sm">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="rounded border border-gray-300 px-3 py-1.5 hover:bg-gray-50">
                ← Previous
              </Link>
            ) : (
              <span className="rounded border border-gray-200 px-3 py-1.5 text-gray-300">← Previous</span>
            )}
            <span className="text-gray-500">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} className="rounded border border-gray-300 px-3 py-1.5 hover:bg-gray-50">
                Next →
              </Link>
            ) : (
              <span className="rounded border border-gray-200 px-3 py-1.5 text-gray-300">Next →</span>
            )}
          </nav>
        )}
        </div>
      </div>
    </div>
  );
}
