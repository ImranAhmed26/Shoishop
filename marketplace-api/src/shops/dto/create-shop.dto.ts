import { IsOptional, IsString, IsUUID, Matches, MinLength } from 'class-validator';

export class CreateShopDto {
  @MinLength(2)
  name: string;

  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase letters, numbers, and hyphens only' })
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  /** ADMIN-only: create a shop on behalf of another user. Ignored for non-admins. */
  @IsOptional()
  @IsUUID()
  ownerId?: string;
}
