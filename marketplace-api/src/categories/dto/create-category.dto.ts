import { Matches, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @MinLength(2)
  name: string;

  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase letters, numbers, and hyphens only' })
  slug: string;
}
