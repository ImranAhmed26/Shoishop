import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReelStatus } from '@prisma/client';

export class UpdateReelDto {
  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsEnum(ReelStatus)
  status?: ReelStatus;
}
