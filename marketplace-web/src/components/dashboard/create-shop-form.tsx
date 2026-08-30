'use client';

import { useState } from 'react';
import { useCreateShop } from '@/hooks/use-shops';
import { createShopSchema, firstFieldError } from '@/lib/validation';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function CreateShopForm() {
  const createShop = useCreateShop();
  const [name, setName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);
    const result = createShopSchema.safeParse({ name, slug: slugify(name) });
    if (!result.success) {
      setValidationError(firstFieldError(result.error));
      return;
    }
    await createShop.mutateAsync(result.data);
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16 text-center">
      <h1 className="mb-2 text-xl font-semibold">Create your shop</h1>
      <p className="mb-6 text-sm text-gray-500">
        You don&apos;t have a shop yet. Give it a name to get started.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          required
          placeholder="Shop name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-transparent"
        />
        {validationError && <p className="text-sm text-red-600">{validationError}</p>}
        <button
          type="submit"
          disabled={createShop.isPending || !name}
          className="rounded bg-brand-primary hover:bg-brand-primary-dark px-3 py-2 text-white disabled:opacity-50"
        >
          {createShop.isPending ? 'Creating...' : 'Create shop'}
        </button>
      </form>
    </div>
  );
}
