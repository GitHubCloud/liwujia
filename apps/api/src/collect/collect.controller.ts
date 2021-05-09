import { Controller, Get, Post, Body, Param, Delete, UseInterceptors, ClassSerializerInterceptor, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { isEnum } from 'class-validator';
import { Pagination } from 'nestjs-typeorm-paginate';
import { IsNull, Not } from 'typeorm';
import { ArticleTypes } from '../article/articleType.enum';
import { PaginationDto } from '../pagination.dto';
import { CollectService } from './collect.service';
import { Collect } from './entities/collect.entity';

@ApiTags('Collect')
@Controller('collect')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(AuthGuard('jwt'))
export class CollectController {
  constructor(private readonly collectService: CollectService) { }

  @Get()
  async paginate(
    @Query() paginationDto: PaginationDto,
    @Query('schema') schema?: '',
    @Query('type') type?: '',
  ): Promise<Pagination<Collect>> {
    if (type && isEnum(type, ArticleTypes)) paginationDto.query = { type };
    /* switch (schema) {
      case 'article':
      default:
        paginationDto.query['article'] = Not(IsNull());
        break;
    } */

    return await this.collectService.paginate(paginationDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return await this.collectService.remove(id);
  }
}
