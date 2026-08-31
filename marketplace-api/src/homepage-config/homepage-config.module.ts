import { Module } from '@nestjs/common';
import { HomepageConfigAdminController } from './homepage-config-admin.controller';
import { HomepageConfigController } from './homepage-config.controller';
import { HomepageConfigService } from './homepage-config.service';

@Module({
  controllers: [HomepageConfigController, HomepageConfigAdminController],
  providers: [HomepageConfigService],
})
export class HomepageConfigModule {}
