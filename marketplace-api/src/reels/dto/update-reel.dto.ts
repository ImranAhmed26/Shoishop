import { IsEnum, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import { ReelStatus } from '@prisma/client';

export class UpdateReelDto {
  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  /** Pass null to unlink the product; omit to leave it unchanged. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  linkedProductId?: string | null;

  @IsOptional()
  @IsEnum(ReelStatus)
  status?: ReelStatus;
}
