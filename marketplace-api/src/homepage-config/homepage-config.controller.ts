import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { HomepageConfigService } from './homepage-config.service';

@Public()
@Controller('homepage-config')
export class HomepageConfigController {
  constructor(private readonly homepageConfigService: HomepageConfigService) {}

  @Get()
  getPublicConfig() {
    return this.homepageConfigService.getPublicConfig();
  }
}
