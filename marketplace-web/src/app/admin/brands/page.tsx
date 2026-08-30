'use client';

import { useState } from 'react';
import { useBrands, useCreateBrand, useDeleteBrand } from '@/hooks/use-brands';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

export default function AdminBrandsPage() {
  const { data: brands, isLoading } = useBrands();
  const createBrand = useCreateBrand();
  const deleteBrand = useDeleteBrand();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createBrand.mutateAsync({ name, slug: slug || slugify(name) });
      setName('');
      setSlug('');
      setSlugEdited(false);
    } catch {
      setError('Failed to create brand. The slug may already be in use.');
    }
  }

  return (
    <div>
      <PageHeader title="Brands" />

      <Card title="Add a brand" className="mb-6">
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500">Name</label>
            <input
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugEdited) setSlug(slugify(e.target.value));
              }}
              className="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500">Slug</label>
            <input
              required
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugEdited(true);
              }}
              className="w-40 rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={createBrand.isPending}
            className="rounded bg-brand-primary hover:bg-brand-primary-dark px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {createBrand.isPending ? 'Adding...' : 'Add brand'}
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Card>

      <Card title="All brands">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading brands...</p>
        ) : brands?.length === 0 ? (
          <p className="text-sm text-gray-500">No brands yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left dark:border-gray-800">
                <th className="py-2">Name</th>
                <th className="py-2">Slug</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {brands?.map((brand) => (
                <tr key={brand.id} className="border-b border-gray-100 dark:border-gray-900">
                  <td className="py-2">{brand.name}</td>
                  <td className="py-2 text-gray-500">{brand.slug}</td>
                  <td className="py-2">
                    <button
                      onClick={() => deleteBrand.mutate(brand.id)}
                      className="text-xs text-red-600 underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
