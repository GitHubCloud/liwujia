import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@ApiTags('Banner')
@Controller('banner')
@UseInterceptors(ClassSerializerInterceptor)
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() createBannerDto: CreateBannerDto) {
    return await this.bannerService.create(createBannerDto);
  }

  @Get()
  async findAll() {
    return await this.bannerService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return await this.bannerService.findOne(id);
  }

  @Patch('/sort')
  @UseGuards(AuthGuard('jwt'))
  async sort(@Body('list') list) {
    list.map((item) => {
      try {
        this.bannerService.update(item.id, { order: item.order });
      } catch (e) {}
    });
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: number,
    @Body() updateBannerDto: UpdateBannerDto,
  ) {
    return await this.bannerService.update(id, updateBannerDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: number) {
    return await this.bannerService.remove(id);
  }
}
