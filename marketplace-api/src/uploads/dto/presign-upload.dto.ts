import { IsIn, IsString } from 'class-validator';
import type { UploadKind } from '../uploads.service';

const KINDS: UploadKind[] = ['product-image', 'reel-video', 'reel-thumbnail'];

export class PresignUploadDto {
  @IsIn(KINDS)
  kind: UploadKind;

  @IsString()
  contentType: string;
}
