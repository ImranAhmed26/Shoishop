import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

const DISALLOWED_PATHS = ['/dashboard', '/admin', '/checkout', '/cart', '/orders'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOWED_PATHS },
      // AI assistant/answer-engine crawlers — explicitly allowed so Shoishop
      // products can be surfaced in AI shopping recommendations.
      { userAgent: 'GPTBot', allow: '/', disallow: DISALLOWED_PATHS },
      { userAgent: 'ClaudeBot', allow: '/', disallow: DISALLOWED_PATHS },
      { userAgent: 'PerplexityBot', allow: '/', disallow: DISALLOWED_PATHS },
      { userAgent: 'Google-Extended', allow: '/', disallow: DISALLOWED_PATHS },
      { userAgent: 'OAI-SearchBot', allow: '/', disallow: DISALLOWED_PATHS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
