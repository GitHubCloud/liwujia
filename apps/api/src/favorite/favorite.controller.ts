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
import { FavoriteService } from './favorite.service';
import { Favorite } from './entities/favorite.entity';

@ApiTags('Favorite')
@Controller('favorite')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(AuthGuard('jwt'))
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Get()
  async paginate(
    @Req() req,
    @Query() paginationDto: PaginationDto,
    @Query('schema') schema?: string,
    @Query('type') type?: string,
  ): Promise<Pagination<Favorite>> {
    paginationDto.query = {};
    if (type && isEnum(type, ArticleTypes)) paginationDto.query['type'] = type;

    return await this.favoriteService.paginate(paginationDto, schema, req.user);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return await this.favoriteService.remove(id);
  }
}
