import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { UploadsService } from './uploads.service';

@Roles('SHOP_OWNER', 'ADMIN')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presign')
  async presign(@Body() dto: PresignUploadDto) {
    if (!this.uploadsService.isAllowedContentType(dto.kind, dto.contentType)) {
      throw new BadRequestException(`Content type ${dto.contentType} not allowed for ${dto.kind}`);
    }
    return this.uploadsService.createPresignedUpload(dto.kind, dto.contentType);
  }
}
