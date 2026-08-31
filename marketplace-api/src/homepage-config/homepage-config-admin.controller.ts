import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { HomepageConfigService } from './homepage-config.service';
import { CreateHomepageLinkDto } from './dto/create-homepage-link.dto';
import { UpdateHeroDto } from './dto/update-hero.dto';

@Roles('ADMIN')
@Controller('admin/homepage-config')
export class HomepageConfigAdminController {
  constructor(private readonly homepageConfigService: HomepageConfigService) {}

  @Get()
  getConfig() {
    return this.homepageConfigService.getAdminConfig();
  }

  @Patch('hero')
  updateHero(@Body() dto: UpdateHeroDto) {
    return this.homepageConfigService.updateHero(dto);
  }

  @Post('links')
  addLink(@Body() dto: CreateHomepageLinkDto) {
    return this.homepageConfigService.addLink(dto);
  }

  @Delete('links/:id')
  removeLink(@Param('id') id: string) {
    return this.homepageConfigService.removeLink(id);
  }

  @Patch('links/:id/move')
  moveLink(@Param('id') id: string, @Body('direction') direction: 'up' | 'down') {
    return this.homepageConfigService.moveLink(id, direction);
  }
}
