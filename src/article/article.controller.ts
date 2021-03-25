import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Put,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { Pagination } from 'nestjs-typeorm-paginate';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from './entities/article.entity';

@ApiTags('Article')
@Controller('article')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  async create(
    @Req() req,
    @Body() createArticleDto: CreateArticleDto,
  ): Promise<Article> {
    createArticleDto.author = req.user.id;

    return await this.articleService.create(createArticleDto);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, schema: { default: 1 } })
  @ApiQuery({ name: 'limit', required: false, schema: { default: 10 } })
  async paginate(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<Pagination<Article>> {
    return await this.articleService.paginate(page, limit >= 100 ? 100 : limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Article> {
    return await this.articleService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return await this.articleService.update(id, updateArticleDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return await this.articleService.remove(id);
  }

  @Patch('/favorite/:id')
  async favorite(@Param('id') id: number) {
    return await this.articleService.favorite(id);
  }
}
