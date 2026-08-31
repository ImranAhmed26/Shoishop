import { IsEnum, IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { HomepageLinkType } from '@prisma/client';

export class CreateHomepageLinkDto {
  @IsEnum(HomepageLinkType)
  type: HomepageLinkType;

  @ValidateIf((dto) => dto.type === HomepageLinkType.CATEGORY)
  @IsUUID()
  categoryId?: string;

  @ValidateIf((dto) => dto.type === HomepageLinkType.BRAND)
  @IsUUID()
  brandId?: string;
}
