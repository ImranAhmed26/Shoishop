'use client';

import { useRef, useState } from 'react';
import { useShopContext } from '@/contexts/shop-context';
import { useShopProducts } from '@/hooks/use-products';
import {
  useCreateReel,
  useDeleteReel,
  useShopReels,
  useUpdateReel,
} from '@/hooks/use-reels';
import { captureVideoFrame, uploadFileDirectToS3 } from '@/hooks/use-uploads';
import { Reel } from '@/lib/types';

const MAX_DURATION_SECONDS = 60;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => reject(new Error('Could not read video metadata'));
    video.src = URL.createObjectURL(file);
  });
}

export function ReelsManager() {
  const { shopId } = useShopContext();
  const { data: reels, isLoading } = useShopReels(shopId);
  const { data: products } = useShopProducts(shopId);
  const createReel = useCreateReel(shopId);
  const updateReel = useUpdateReel(shopId);
  const deleteReel = useDeleteReel(shopId);

  const [caption, setCaption] = useState('');
  const [linkedProductId, setLinkedProductId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editLinkedProductId, setEditLinkedProductId] = useState('');

  function startEdit(reel: Reel) {
    setEditingId(reel.id);
    setEditCaption(reel.caption ?? '');
    setEditLinkedProductId(reel.linkedProductId ?? '');
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(reelId: string) {
    await updateReel.mutateAsync({
      reelId,
      caption: editCaption,
      linkedProductId: editLinkedProductId || null,
    });
    setEditingId(null);
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !shopId) return;
    setError(null);

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('Video must be under 50MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const duration = await readVideoDuration(file);
      if (duration > MAX_DURATION_SECONDS) {
        setError(`Video must be ${MAX_DURATION_SECONDS}s or shorter (got ${Math.round(duration)}s).`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      // Generate a poster frame client-side so the dashboard grid and feed can show
      // a lightweight image instead of loading the full video just to preview it.
      const thumbnailBlob = await captureVideoFrame(file);

      const videoUrl = await uploadFileDirectToS3(file, 'reel-video', (fraction) =>
        setUploadProgress(thumbnailBlob ? fraction * 0.7 : fraction * 0.9),
      );
      const thumbnailUrl = thumbnailBlob
        ? await uploadFileDirectToS3(thumbnailBlob, 'reel-thumbnail', (fraction) =>
            setUploadProgress(0.7 + fraction * 0.3),
          )
        : undefined;

      await createReel.mutateAsync({
        videoUrl,
        thumbnailUrl,
        caption: caption || undefined,
        linkedProductId: linkedProductId || undefined,
      });
      setCaption('');
      setLinkedProductId('');
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  if (!shopId) {
    return <p className="text-sm text-gray-500">No shop selected.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 rounded border border-dashed border-gray-300 p-3 dark:border-gray-700">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs text-gray-500">Caption (optional)</label>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-transparent"
              placeholder="Say something about this reel"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Link a product (optional)</label>
            <select
              value={linkedProductId}
              onChange={(e) => setLinkedProductId(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-transparent"
            >
              <option value="">— none —</option>
              {products?.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={handleFileSelected}
          disabled={isUploading}
          className="text-xs"
        />
        <p className="text-xs text-gray-500">Max {MAX_DURATION_SECONDS}s, up to 50MB.</p>
        {isUploading && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
              <div
                className="h-full rounded-full bg-brand-primary transition-all"
                style={{ width: `${Math.round(uploadProgress * 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{Math.round(uploadProgress * 100)}%</span>
          </div>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading reels...</p>
      ) : reels?.length === 0 ? (
        <p className="text-sm text-gray-500">No reels yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {reels?.map((reel) =>
            editingId === reel.id ? (
              <div
                key={reel.id}
                className="col-span-2 flex flex-col gap-2 rounded border border-gray-200 p-2 text-xs dark:border-gray-800 sm:col-span-2"
              >
                <label className="text-gray-500">Caption</label>
                <input
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
                />
                <label className="text-gray-500">Linked product</label>
                <select
                  value={editLinkedProductId}
                  onChange={(e) => setEditLinkedProductId(e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-transparent"
                >
                  <option value="">— none —</option>
                  {products?.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(reel.id)}
                    disabled={updateReel.isPending}
                    className="rounded bg-brand-primary px-2 py-1 text-white hover:bg-brand-primary-dark disabled:opacity-50"
                  >
                    {updateReel.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="rounded border border-gray-300 px-2 py-1 dark:border-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={reel.id}
                className="flex flex-col gap-1.5 rounded border border-gray-200 p-2 text-xs dark:border-gray-800"
              >
                <div className="relative aspect-[9/16] w-full overflow-hidden rounded bg-black">
                  <video
                    src={reel.videoUrl}
                    poster={reel.thumbnailUrl ?? undefined}
                    className="h-full w-full object-cover"
                    muted
                    controls
                    preload="none"
                  />
                  <span
                    className={`absolute right-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-white ${
                      reel.status === 'PUBLISHED' ? 'bg-green-600/90' : 'bg-gray-600/90'
                    }`}
                  >
                    {reel.status}
                  </span>
                </div>
                <p className="truncate" title={reel.caption ?? ''}>
                  {reel.caption || 'No caption'}
                </p>
                {reel.linkedProduct ? (
                  <p className="truncate text-gray-500" title={reel.linkedProduct.title}>
                    🔗 {reel.linkedProduct.title}
                  </p>
                ) : (
                  <p className="text-gray-400">No product linked</p>
                )}
                <p className="text-gray-500">{reel.viewCount} views</p>
                <div className="flex items-center justify-between gap-1">
                  <select
                    value={reel.status}
                    onChange={(e) =>
                      updateReel.mutate({ reelId: reel.id, status: e.target.value as typeof reel.status })
                    }
                    className="w-full rounded border border-gray-300 px-1 py-0.5 dark:border-gray-700 dark:bg-transparent"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="HIDDEN">HIDDEN</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => startEdit(reel)} className="text-blue-600 underline">
                    Edit
                  </button>
                  <button
                    onClick={() => deleteReel.mutate(reel.id)}
                    className="text-red-600 underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
