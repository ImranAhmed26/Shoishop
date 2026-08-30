'use client';

import { api } from '@/lib/api';

type UploadKind = 'product-image' | 'reel-video' | 'reel-thumbnail';

interface PresignedUpload {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export async function uploadFileDirectToS3(file: File, kind: UploadKind): Promise<string> {
  const { data } = await api.post<PresignedUpload>('/uploads/presign', {
    kind,
    contentType: file.type,
  });

  await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  return data.publicUrl;
}
