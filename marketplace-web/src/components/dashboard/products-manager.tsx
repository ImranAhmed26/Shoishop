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
import { useCategories } from '@/hooks/use-categories';
import { uploadFileDirectToS3 } from '@/hooks/use-uploads';
import { API_URL } from '@/lib/api';
import { Product, ProductVisibility } from '@/lib/types';
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
  const { data: categories } = useCategories();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [weight, setWeight] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandName, setBrandName] = useState('');
  const [visibility, setVisibility] = useState<ProductVisibility>('VISIBLE');
  const [images, setImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [importSummary, setImportSummary] = useState<BulkImportSummary | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setIsUploadingImages(true);
    try {
      const remaining = Math.max(0, 10 - images.length);
      const uploaded = await Promise.all(
        files.slice(0, remaining).map((file) => uploadFileDirectToS3(file, 'product-image')),
      );
      setImages((prev) => [...prev, ...uploaded]);
    } finally {
      setIsUploadingImages(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((img) => img !== url));
  }

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
      compareAtPriceCents: compareAtPrice ? Math.round(parseFloat(compareAtPrice) * 100) : undefined,
      costPriceCents: costPrice ? Math.round(parseFloat(costPrice) * 100) : undefined,
      stockQty: parseInt(stock, 10) || 0,
      weight: weight ? parseFloat(weight) : undefined,
    });
    if (!result.success) {
      setValidationError(firstFieldError(result.error));
      return;
    }
    await createProduct.mutateAsync({
      ...result.data,
      categoryId: categoryId || undefined,
      brandName: brandName.trim() || undefined,
      visibility,
      images,
      status: 'DRAFT',
    });
    setTitle('');
    setPrice('');
    setCompareAtPrice('');
    setCostPrice('');
    setStock('0');
    setWeight('');
    setCategoryId('');
    setBrandName('');
    setVisibility('VISIBLE');
    setImages([]);
  }

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCompareAtPrice, setEditCompareAtPrice] = useState('');
  const [editCostPrice, setEditCostPrice] = useState('');
  const [editStock, setEditStock] = useState('0');
  const [editWeight, setEditWeight] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editBrandName, setEditBrandName] = useState('');
  const [editVisibility, setEditVisibility] = useState<ProductVisibility>('VISIBLE');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [isUploadingEditImages, setIsUploadingEditImages] = useState(false);
  const [editValidationError, setEditValidationError] = useState<string | null>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);

  function startEdit(product: Product) {
    setEditingId(product.id);
    setEditTitle(product.title);
    setEditPrice((product.priceCents / 100).toString());
    setEditCompareAtPrice(
      product.compareAtPriceCents != null ? (product.compareAtPriceCents / 100).toString() : '',
    );
    setEditCostPrice(product.costPriceCents != null ? (product.costPriceCents / 100).toString() : '');
    setEditStock(product.stockQty.toString());
    setEditWeight(product.weight != null ? product.weight.toString() : '');
    setEditCategoryId(product.categoryId ?? '');
    setEditBrandName(product.brand?.name ?? '');
    setEditVisibility(product.visibility);
    setEditImages(product.images ?? []);
    setEditValidationError(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleEditImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setIsUploadingEditImages(true);
    try {
      const remaining = Math.max(0, 10 - editImages.length);
      const uploaded = await Promise.all(
        files.slice(0, remaining).map((file) => uploadFileDirectToS3(file, 'product-image')),
      );
      setEditImages((prev) => [...prev, ...uploaded]);
    } finally {
      setIsUploadingEditImages(false);
      if (editImageInputRef.current) editImageInputRef.current.value = '';
    }
  }

  function removeEditImage(url: string) {
    setEditImages((prev) => prev.filter((img) => img !== url));
  }

  async function saveEdit(productId: string) {
    setEditValidationError(null);
    const result = createProductSchema.safeParse({
      title: editTitle,
      priceCents: Math.round(parseFloat(editPrice) * 100),
      compareAtPriceCents: editCompareAtPrice
        ? Math.round(parseFloat(editCompareAtPrice) * 100)
        : undefined,
      costPriceCents: editCostPrice ? Math.round(parseFloat(editCostPrice) * 100) : undefined,
      stockQty: parseInt(editStock, 10) || 0,
      weight: editWeight ? parseFloat(editWeight) : undefined,
    });
    if (!result.success) {
      setEditValidationError(firstFieldError(result.error));
      return;
    }
    await updateProduct.mutateAsync({
      productId,
      ...result.data,
      categoryId: editCategoryId || null,
      brandName: editBrandName.trim() || undefined,
      visibility: editVisibility,
      images: editImages,
    });
    setEditingId(null);
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
          <label className="text-xs text-gray-500">Compare-at price</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
            className="w-28 rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Cost price</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
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
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Weight (g)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-24 rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
          >
            <option value="">— none —</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Brand</label>
          <input
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            className="w-32 rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Visibility</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as ProductVisibility)}
            className="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
          >
            <option value="VISIBLE">VISIBLE</option>
            <option value="HIDDEN">HIDDEN</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Images</label>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            disabled={isUploadingImages || images.length >= 10}
            className="text-xs"
          />
        </div>
        <button
          type="submit"
          disabled={createProduct.isPending || isUploadingImages}
          className="rounded bg-orange-600 hover:bg-orange-700 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {createProduct.isPending ? 'Adding...' : 'Add product'}
        </button>
      </form>
      {isUploadingImages && <p className="text-xs text-gray-500">Uploading images...</p>}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url) => (
            <div key={url} className="relative h-16 w-16 overflow-hidden rounded border border-gray-200 dark:border-gray-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute right-0 top-0 rounded-bl bg-black/60 px-1 text-[10px] text-white"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
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
            {products?.map((product) =>
              editingId === product.id ? (
                <tr key={product.id} className="border-b border-gray-100 dark:border-gray-900">
                  <td colSpan={5} className="py-3">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-500">Title</label>
                          <input
                            required
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
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
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-28 rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-500">Compare-at price</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editCompareAtPrice}
                            onChange={(e) => setEditCompareAtPrice(e.target.value)}
                            className="w-28 rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-500">Cost price</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editCostPrice}
                            onChange={(e) => setEditCostPrice(e.target.value)}
                            className="w-28 rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-500">Stock</label>
                          <input
                            type="number"
                            min="0"
                            value={editStock}
                            onChange={(e) => setEditStock(e.target.value)}
                            className="w-24 rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-500">Weight (g)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editWeight}
                            onChange={(e) => setEditWeight(e.target.value)}
                            className="w-24 rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-500">Category</label>
                          <select
                            value={editCategoryId}
                            onChange={(e) => setEditCategoryId(e.target.value)}
                            className="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
                          >
                            <option value="">— none —</option>
                            {categories?.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-500">Brand</label>
                          <input
                            value={editBrandName}
                            onChange={(e) => setEditBrandName(e.target.value)}
                            className="w-32 rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-500">Visibility</label>
                          <select
                            value={editVisibility}
                            onChange={(e) => setEditVisibility(e.target.value as ProductVisibility)}
                            className="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
                          >
                            <option value="VISIBLE">VISIBLE</option>
                            <option value="HIDDEN">HIDDEN</option>
                          </select>
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-500">Add images</label>
                          <input
                            ref={editImageInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleEditImageSelect}
                            disabled={isUploadingEditImages || editImages.length >= 10}
                            className="text-xs"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => saveEdit(product.id)}
                          disabled={updateProduct.isPending || isUploadingEditImages}
                          className="rounded bg-orange-600 hover:bg-orange-700 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                        >
                          {updateProduct.isPending ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                      {isUploadingEditImages && (
                        <p className="text-xs text-gray-500">Uploading images...</p>
                      )}
                      {editImages.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {editImages.map((url) => (
                            <div
                              key={url}
                              className="relative h-16 w-16 overflow-hidden rounded border border-gray-200 dark:border-gray-700"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt="" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeEditImage(url)}
                                className="absolute right-0 top-0 rounded-bl bg-black/60 px-1 text-[10px] text-white"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {editValidationError && (
                        <p className="text-sm text-red-600">{editValidationError}</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
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
                  <td className="py-2 whitespace-nowrap">
                    <button
                      onClick={() => startEdit(product)}
                      className="mr-3 text-xs text-blue-600 underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteProduct.mutate(product.id)}
                      className="text-xs text-red-600 underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
