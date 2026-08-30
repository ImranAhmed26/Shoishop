'use client';

import { useState } from 'react';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/use-categories';

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

export default function AdminCategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createCategory.mutateAsync({ name, slug: slug || slugify(name) });
      setName('');
      setSlug('');
      setSlugEdited(false);
    } catch {
      setError('Failed to create category. The slug may already be in use.');
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Categories</h1>

      <form onSubmit={handleCreate} className="mb-6 flex flex-wrap items-end gap-3">
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
          disabled={createCategory.isPending}
          className="rounded bg-orange-600 hover:bg-orange-700 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {createCategory.isPending ? 'Adding...' : 'Add category'}
        </button>
      </form>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading categories...</p>
      ) : categories?.length === 0 ? (
        <p className="text-sm text-gray-500">No categories yet.</p>
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
            {categories?.map((category) => (
              <tr key={category.id} className="border-b border-gray-100 dark:border-gray-900">
                <td className="py-2">{category.name}</td>
                <td className="py-2 text-gray-500">{category.slug}</td>
                <td className="py-2">
                  <button
                    onClick={() => deleteCategory.mutate(category.id)}
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
    </div>
  );
}
