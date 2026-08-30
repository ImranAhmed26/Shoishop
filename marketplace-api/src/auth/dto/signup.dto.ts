import { IsEmail, IsEnum, IsOptional, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class SignupDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @MinLength(1)
  name: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: Extract<UserRole, 'BUYER' | 'SHOP_OWNER'>;
}
