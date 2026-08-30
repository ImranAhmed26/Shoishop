import Link from 'next/link';
import { buildBreadcrumbJsonLd, type BreadcrumbItem } from '@/lib/seo';

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = buildBreadcrumbJsonLd(items);

  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-xs text-gray-500">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => (
          <li key={item.path} className="flex items-center gap-1">
            {index > 0 && <span aria-hidden="true">/</span>}
            {index === items.length - 1 ? (
              <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
            ) : (
              <Link href={item.path} className="hover:underline">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
