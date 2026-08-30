import { Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

export type UploadKind = 'product-image' | 'reel-video' | 'reel-thumbnail';

const ALLOWED_CONTENT_TYPES: Record<UploadKind, string[]> = {
  'product-image': ['image/jpeg', 'image/png', 'image/webp'],
  'reel-video': ['video/mp4', 'video/webm', 'video/quicktime'],
  'reel-thumbnail': ['image/jpeg', 'image/png', 'image/webp'],
};

const PREFIX: Record<UploadKind, string> = {
  'product-image': 'products',
  'reel-video': 'reels/videos',
  'reel-thumbnail': 'reels/thumbnails',
};

@Injectable()
export class UploadsService {
  private readonly s3 = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' });

  isAllowedContentType(kind: UploadKind, contentType: string): boolean {
    return ALLOWED_CONTENT_TYPES[kind].includes(contentType);
  }

  async createPresignedUpload(kind: UploadKind, contentType: string) {
    const bucket = process.env.AWS_S3_BUCKET as string;
    const key = `${PREFIX[kind]}/${randomUUID()}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 60 * 5 });
    const publicUrl = process.env.CDN_BASE_URL
      ? `${process.env.CDN_BASE_URL.replace(/\/$/, '')}/${key}`
      : `https://${bucket}.s3.${process.env.AWS_REGION ?? 'us-east-1'}.amazonaws.com/${key}`;

    return { uploadUrl, publicUrl, key };
  }
}
