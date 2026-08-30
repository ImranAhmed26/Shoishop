import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { ReelsService } from './reels.service';

@Public()
@Controller('reels')
export class ReelsController {
  constructor(private readonly reelsService: ReelsService) {}

  @Get('feed')
  feed(@Query('cursor') cursor?: string) {
    return this.reelsService.feed(cursor);
  }

  @Post(':reelId/view')
  registerView(@Param('reelId') reelId: string) {
    return this.reelsService.incrementView(reelId);
  }
}
