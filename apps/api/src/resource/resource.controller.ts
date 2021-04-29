import {
  ClassSerializerInterceptor,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Resource } from './entities/resource.entity';
import { OssService } from './oss.service';
import { ResourceService } from './resource.service';

@ApiTags('Resource')
@Controller('resource')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
export class ResourceController {
  constructor(
    private readonly resourceService: ResourceService,
    private readonly ossService: OssService,
    private readonly configService: ConfigService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      dest: '/tmp',
    }),
  )
  async upload(@UploadedFile() file, @Req() req): Promise<Resource> {
    const { dest, x, y, text } = req.body;

    const ossPath = await this.ossService.upload(file, dest);

    return await this.resourceService.save({
      ossPath,
      mime: file.mimetype,
      size: file.size,
      label: {
        x,
        y,
        text,
      },
    });
  }
}
