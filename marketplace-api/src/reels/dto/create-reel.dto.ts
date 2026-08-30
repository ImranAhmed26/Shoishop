import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateReelDto {
  @MinLength(1)
  videoUrl: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsUUID()
  linkedProductId?: string;
}
