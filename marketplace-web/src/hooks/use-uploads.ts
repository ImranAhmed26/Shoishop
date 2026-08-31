'use client';

import { api } from '@/lib/api';

type UploadKind = 'product-image' | 'reel-video' | 'reel-thumbnail';

interface PresignedUpload {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export async function uploadFileDirectToS3(
  file: File | Blob,
  kind: UploadKind,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  const contentType = file.type || 'application/octet-stream';
  const { data } = await api.post<PresignedUpload>('/uploads/presign', {
    kind,
    contentType,
  });

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', data.uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) {
        onProgress(event.loaded / event.total);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(file);
  });

  return data.publicUrl;
}

/** Grabs a single frame from a video file as a JPEG blob, for use as a poster/thumbnail. */
export function captureVideoFrame(file: File, atSeconds = 1): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    const cleanup = () => URL.revokeObjectURL(url);
    const finish = (result: Blob | null) => {
      cleanup();
      resolve(result);
    };

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(atSeconds, Math.max(0, video.duration - 0.1));
    };
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx || canvas.width === 0 || canvas.height === 0) {
        finish(null);
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => finish(blob), 'image/jpeg', 0.8);
    };
    video.onerror = () => finish(null);
  });
}
