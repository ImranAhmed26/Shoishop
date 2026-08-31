import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { SITE_URL } from '@/lib/seo';
import { Product } from '@/lib/types';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ProductAddToCart } from '@/components/product-add-to-cart';
import { ProductReviews } from '@/components/product-reviews';

function formatPrice(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/products/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) {
    return { title: 'Product not found — Shoishop' };
  }

  const description =
    product.description?.slice(0, 160) ??
    `Buy ${product.title} from ${product.shop?.name ?? 'a local shop'} on Shoishop.`;
  const image = product.images?.[0];

  return {
    title: `${product.title} — Shoishop`,
    description,
    alternates: { canonical: `${SITE_URL}/product/${product.id}` },
    openGraph: {
      title: product.title,
      description,
      type: 'website',
      images: image ? [{ url: `${SITE_URL}${image}` }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const image = product.images?.[0];
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description ?? undefined,
    image: image ? [`${SITE_URL}${image}`] : undefined,
    sku: product.id,
    brand: product.shop ? { '@type': 'Organization', name: product.shop.name } : undefined,
    aggregateRating: product.reviewCount
      ? {
          '@type': 'AggregateRating',
          ratingValue: product.avgRating ?? 0,
          reviewCount: product.reviewCount,
        }
      : undefined,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${product.id}`,
      price: (product.priceCents / 100).toFixed(2),
      priceCurrency: product.currency,
      availability:
        product.stockQty > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    ...(product.category
      ? [{ name: product.category.name, path: `/category/${product.category.slug}` }]
      : []),
    { name: product.title, path: `/product/${product.id}` },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <Breadcrumbs items={breadcrumbItems} />
      {product.shop && (
        <Link href={`/shop/${product.shop.slug}`} className="text-xs text-gray-500 underline">
          {product.shop.name}
        </Link>
      )}
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded bg-gray-100 dark:bg-gray-900">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={product.title} className="h-full w-full object-cover" />
          )}
        </div>
        <div>
          <h1 className="text-xl font-semibold">{product.title}</h1>
          {product.reviewCount ? (
            <p className="mt-1 text-sm text-brand-primary-dark">
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
          <ProductAddToCart product={product} />
        </div>
      </div>
      <ProductReviews productId={product.id} />
    </div>
  );
}
