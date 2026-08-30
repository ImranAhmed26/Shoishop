import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ShopStatus } from '@prisma/client';

export class UpdateShopDto {
  @IsOptional()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @IsOptional()
  @IsEnum(ShopStatus)
  status?: ShopStatus;
}
