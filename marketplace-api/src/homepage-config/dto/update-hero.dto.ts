import { IsOptional, ValidateIf } from 'class-validator';
import { IsUrl } from 'class-validator';

export class UpdateHeroDto {
  /** Pass null to clear the hero image; omit to leave it unchanged. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUrl({ require_tld: false })
  heroImageUrl?: string | null;
}
