import {
  Controller,
  Get,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { isEnum } from 'class-validator';
import { Pagination } from 'nestjs-typeorm-paginate';
import { ArticleTypes } from '../article/articleType.enum';
import { PaginationDto } from '../pagination.dto';
import { CollectService } from './collect.service';
import { Collect } from './entities/collect.entity';

@ApiTags('Collect')
@Controller('collect')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(AuthGuard('jwt'))
export class CollectController {
  constructor(private readonly collectService: CollectService) {}

  @Get()
  async paginate(
    @Req() req,
    @Query() paginationDto: PaginationDto,
    @Query('schema') schema?: string,
    @Query('type') type?: string,
  ): Promise<Pagination<Collect>> {
    paginationDto.query = {};
    if (type && isEnum(type, ArticleTypes)) paginationDto.query['type'] = type;

    return await this.collectService.paginate(paginationDto, schema, req.user);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return await this.collectService.remove(id);
  }
}
