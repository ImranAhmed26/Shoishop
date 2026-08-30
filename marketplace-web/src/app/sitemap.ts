import type { MetadataRoute } from 'next';
import { API_URL } from '@/lib/api';
import { SITE_URL } from '@/lib/seo';

interface SitemapProduct {
  id: string;
  updatedAt: string;
}
interface SitemapShop {
  slug: string;
  updatedAt: string;
}
interface SitemapCategory {
  slug: string;
}

async function getAllProducts(): Promise<SitemapProduct[]> {
  try {
    const res = await fetch(`${API_URL}/products?pageSize=1000`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

async function getAllShops(): Promise<SitemapShop[]> {
  try {
    const res = await fetch(`${API_URL}/shops`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function getAllCategories(): Promise<SitemapCategory[]> {
  try {
    const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, shops, categories] = await Promise.all([
    getAllProducts(),
    getAllShops(),
    getAllCategories(),
  ]);

  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    ...categories.map((category) => ({
      url: `${SITE_URL}/category/${category.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
    ...shops.map((shop) => ({
      url: `${SITE_URL}/shop/${shop.slug}`,
      lastModified: shop.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
    ...products.map((product) => ({
      url: `${SITE_URL}/product/${product.id}`,
      lastModified: product.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
  ];
}
