'use client';

import { useRef, useState } from 'react';
import { useShopContext } from '@/contexts/shop-context';
import {
  useCreateProduct,
  useDeleteProduct,
  useShopProducts,
  useUpdateProduct,
} from '@/hooks/use-products';
import { useBulkImportProducts, BulkImportSummary } from '@/hooks/use-bulk-import';
import { API_URL } from '@/lib/api';
import { createProductSchema, firstFieldError } from '@/lib/validation';

function formatPrice(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

export function ProductsManager() {
  const { shopId } = useShopContext();
  const { data: products, isLoading } = useShopProducts(shopId);
  const createProduct = useCreateProduct(shopId);
  const updateProduct = useUpdateProduct(shopId);
  const deleteProduct = useDeleteProduct(shopId);
  const bulkImport = useBulkImportProducts(shopId);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [importSummary, setImportSummary] = useState<BulkImportSummary | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportSummary(null);
    const summary = await bulkImport.mutateAsync(file);
    setImportSummary(summary);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!shopId) return;
    setValidationError(null);
    const result = createProductSchema.safeParse({
      title,
      priceCents: Math.round(parseFloat(price) * 100),
      stockQty: parseInt(stock, 10) || 0,
    });
    if (!result.success) {
      setValidationError(firstFieldError(result.error));
      return;
    }
    await createProduct.mutateAsync({ ...result.data, status: 'PUBLISHED' });
    setTitle('');
    setPrice('');
    setStock('0');
  }

  if (!shopId) {
    return <p className="text-sm text-gray-500">No shop selected.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Price</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-28 rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Stock</label>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="w-24 rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={createProduct.isPending}
          className="rounded bg-orange-600 hover:bg-orange-700 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {createProduct.isPending ? 'Adding...' : 'Add product'}
        </button>
      </form>
      {validationError && <p className="text-sm text-red-600">{validationError}</p>}

      <div className="flex flex-wrap items-center gap-3 rounded border border-dashed border-gray-300 p-3 dark:border-gray-700">
        <span className="text-sm font-medium">Bulk import</span>
        <a
          href={`${API_URL}/shops/${shopId}/products/bulk-import/template`}
          className="text-xs text-blue-600 underline"
        >
          Download CSV template
        </a>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={handleImportFile}
          disabled={bulkImport.isPending}
          className="text-xs"
        />
        {bulkImport.isPending && <span className="text-xs text-gray-500">Importing...</span>}
      </div>

      {importSummary && (
        <div className="rounded border border-gray-200 p-3 text-xs dark:border-gray-800">
          <p className="font-medium">
            Imported {importSummary.imported} product{importSummary.imported === 1 ? '' : 's'}
            {importSummary.failed.length > 0 && `, ${importSummary.failed.length} row(s) failed`}
          </p>
          {importSummary.failed.length > 0 && (
            <ul className="mt-1 list-inside list-disc text-red-600">
              {importSummary.failed.map((f) => (
                <li key={f.row}>
                  Row {f.row}: {f.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading products...</p>
      ) : products?.length === 0 ? (
        <p className="text-sm text-gray-500">No products yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left dark:border-gray-800">
              <th className="py-2">Title</th>
              <th className="py-2">Price</th>
              <th className="py-2">Stock</th>
              <th className="py-2">Status</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {products?.map((product) => (
              <tr key={product.id} className="border-b border-gray-100 dark:border-gray-900">
                <td className="py-2">{product.title}</td>
                <td className="py-2">{formatPrice(product.priceCents, product.currency)}</td>
                <td className="py-2">{product.stockQty}</td>
                <td className="py-2">
                  <select
                    value={product.status}
                    onChange={(e) =>
                      updateProduct.mutate({
                        productId: product.id,
                        status: e.target.value as typeof product.status,
                      })
                    }
                    className="rounded border border-gray-300 px-1 py-0.5 text-xs dark:border-gray-700 dark:bg-transparent"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </td>
                <td className="py-2">
                  <button
                    onClick={() => deleteProduct.mutate(product.id)}
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
