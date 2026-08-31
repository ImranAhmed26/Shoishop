'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { useCategories } from '@/hooks/use-categories';
import { useBrands } from '@/hooks/use-brands';
import {
  useAdminHomepageConfig,
  useUpdateHeroImage,
  useAddHomepageLink,
  useRemoveHomepageLink,
  useMoveHomepageLink,
} from '@/hooks/use-homepage-config';
import { HomepageLinkType } from '@/lib/types';

type Tab = 'home' | 'category' | 'brand';

function HomeTab() {
  const { data: config, isLoading } = useAdminHomepageConfig();
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const updateHero = useUpdateHeroImage();
  const addLink = useAddHomepageLink();
  const removeLink = useRemoveHomepageLink();
  const moveLink = useMoveHomepageLink();

  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [linkType, setLinkType] = useState<HomepageLinkType>('CATEGORY');
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    if (config) setHeroImageUrl(config.heroImageUrl ?? '');
  }, [config]);

  const linkedCategoryIds = new Set(
    config?.links.filter((l) => l.type === 'CATEGORY').map((l) => l.slug) ?? [],
  );
  const linkedBrandIds = new Set(
    config?.links.filter((l) => l.type === 'BRAND').map((l) => l.slug) ?? [],
  );
  const availableCategories = categories?.filter((c) => !linkedCategoryIds.has(c.slug)) ?? [];
  const availableBrands = brands?.filter((b) => !linkedBrandIds.has(b.slug)) ?? [];
  const options = linkType === 'CATEGORY' ? availableCategories : availableBrands;

  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    await addLink.mutateAsync(
      linkType === 'CATEGORY' ? { type: 'CATEGORY', categoryId: selectedId } : { type: 'BRAND', brandId: selectedId },
    );
    setSelectedId('');
  }

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="Hero banner" description="Shown at the top of the homepage.">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-1 flex-col">
            <label className="text-xs text-gray-500">Hero image URL</label>
            <input
              value={heroImageUrl}
              onChange={(e) => setHeroImageUrl(e.target.value)}
              placeholder="https://... (leave blank to use the default banner)"
              className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-transparent"
            />
          </div>
          <button
            onClick={() => updateHero.mutate(heroImageUrl.trim() || null)}
            disabled={updateHero.isPending}
            className="rounded bg-brand-primary hover:bg-brand-primary-dark px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {updateHero.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </Card>

      <Card
        title="Homepage quick links"
        description="Buttons on the homepage that link to a category or brand page. Choose which ones show up and in what order."
      >
        <form onSubmit={handleAddLink} className="mb-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500">Type</label>
            <select
              value={linkType}
              onChange={(e) => {
                setLinkType(e.target.value as HomepageLinkType);
                setSelectedId('');
              }}
              className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-transparent"
            >
              <option value="CATEGORY">Category</option>
              <option value="BRAND">Brand</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500">{linkType === 'CATEGORY' ? 'Category' : 'Brand'}</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-56 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-transparent"
            >
              <option value="">— select —</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={!selectedId || addLink.isPending}
            className="rounded bg-brand-primary hover:bg-brand-primary-dark px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            + Add link
          </button>
        </form>

        {config?.links.length === 0 ? (
          <p className="text-sm text-gray-500">No homepage links yet. Add one above.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {config?.links.map((link, index) => (
              <li
                key={link.id}
                className="flex items-center justify-between gap-3 rounded border border-gray-200 px-3 py-2 text-sm dark:border-gray-800"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {link.type === 'CATEGORY' ? 'Category' : 'Brand'}
                  </span>
                  <span>{link.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveLink.mutate({ linkId: link.id, direction: 'up' })}
                    disabled={index === 0 || moveLink.isPending}
                    className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30 dark:hover:text-gray-200"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveLink.mutate({ linkId: link.id, direction: 'down' })}
                    disabled={index === (config?.links.length ?? 0) - 1 || moveLink.isPending}
                    className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30 dark:hover:text-gray-200"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeLink.mutate(link.id)}
                    className="text-xs text-red-600 underline"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function ComingSoonTab({ label }: { label: string }) {
  return (
    <Card title={`${label} page customization`}>
      <p className="text-sm text-gray-500">Coming soon.</p>
    </Card>
  );
}

export default function AdminCustomizePage() {
  const [tab, setTab] = useState<Tab>('home');

  return (
    <div>
      <PageHeader title="Customize App" />

      <div className="mb-6 flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {(['home', 'category', 'brand'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              tab === t
                ? 'border-b-2 border-brand-primary text-brand-primary-dark'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'home' && <HomeTab />}
      {tab === 'category' && <ComingSoonTab label="Category" />}
      {tab === 'brand' && <ComingSoonTab label="Brand" />}
    </div>
  );
}
