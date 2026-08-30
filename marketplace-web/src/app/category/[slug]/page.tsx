import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { SITE_URL } from '@/lib/seo';
import { Category, Product } from '@/lib/types';
import { Breadcrumbs } from '@/components/breadcrumbs';

function formatPrice(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

async function getCategory(slug: string): Promise<Category | null> {
  try {
    const res = await fetch(`${API_URL}/categories/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getCategoryProducts(slug: string): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/products?category=${slug}&pageSize=48`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) {
    return { title: 'Category not found — Shoishop' };
  }

  const description = `Shop ${category.name} products from independent vendors on Shoishop.`;

  return {
    title: `${category.name} — Shoishop`,
    description,
    alternates: { canonical: `${SITE_URL}/category/${category.slug}` },
    openGraph: { title: `${category.name} — Shoishop`, description, type: 'website' },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const products = await getCategoryProducts(slug);

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${category.name} products`,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/product/${product.id}`,
    })),
  };

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: category.name, path: `/category/${category.slug}` },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <Breadcrumbs items={breadcrumbItems} />
      <h1 className="text-2xl font-semibold">{category.name}</h1>

      <div className="mt-6">
        {products.length === 0 ? (
          <p className="text-sm text-gray-500">No products in this category yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="overflow-hidden rounded border border-gray-200 text-sm hover:border-gray-400 dark:border-gray-800"
              >
                <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-900">
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
  );
}
