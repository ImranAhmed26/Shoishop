'use client';

import { useRef, useState } from 'react';
import { useShopContext } from '@/contexts/shop-context';
import {
  useCreateReel,
  useDeleteReel,
  useShopReels,
  useUpdateReel,
} from '@/hooks/use-reels';
import { uploadFileDirectToS3 } from '@/hooks/use-uploads';

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
  const createReel = useCreateReel(shopId);
  const updateReel = useUpdateReel(shopId);
  const deleteReel = useDeleteReel(shopId);

  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const videoUrl = await uploadFileDirectToS3(file, 'reel-video');
      await createReel.mutateAsync({ videoUrl, caption: caption || undefined });
      setCaption('');
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  if (!shopId) {
    return <p className="text-sm text-gray-500">No shop selected.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 rounded border border-dashed border-gray-300 p-3 dark:border-gray-700">
        <label className="text-xs text-gray-500">Caption (optional)</label>
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-transparent"
          placeholder="Say something about this reel"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={handleFileSelected}
          disabled={isUploading}
          className="text-xs"
        />
        <p className="text-xs text-gray-500">Max {MAX_DURATION_SECONDS}s, up to 50MB.</p>
        {isUploading && <p className="text-xs text-gray-500">Uploading...</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading reels...</p>
      ) : reels?.length === 0 ? (
        <p className="text-sm text-gray-500">No reels yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {reels?.map((reel) => (
            <div
              key={reel.id}
              className="flex flex-col gap-2 rounded border border-gray-200 p-2 text-xs dark:border-gray-800"
            >
              <video src={reel.videoUrl} className="aspect-[9/16] w-full rounded bg-black object-cover" muted controls />
              <p className="truncate">{reel.caption || 'No caption'}</p>
              <p className="text-gray-500">{reel.viewCount} views</p>
              <select
                value={reel.status}
                onChange={(e) =>
                  updateReel.mutate({ reelId: reel.id, status: e.target.value as typeof reel.status })
                }
                className="rounded border border-gray-300 px-1 py-0.5 dark:border-gray-700 dark:bg-transparent"
              >
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="HIDDEN">HIDDEN</option>
              </select>
              <button
                onClick={() => deleteReel.mutate(reel.id)}
                className="text-red-600 underline"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
