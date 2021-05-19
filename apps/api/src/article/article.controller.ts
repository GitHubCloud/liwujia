import {
  Controller,
  Get,
  Post,
  Body,
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
import { ApiTags } from '@nestjs/swagger';
import { Pagination } from 'nestjs-typeorm-paginate';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { CommentService } from 'apps/api/src/comment/comment.service';
import { CreateCommentDto } from 'apps/api/src/comment/dto/create-comment.dto';
import { Article } from './entities/article.entity';
import { Comment } from 'apps/api/src/comment/entities/comment.entity';
import { PaginationDto } from 'apps/api/src/pagination.dto';

@ApiTags('Article')
@Controller('article')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(AuthGuard('jwt'))
export class ArticleController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly commentService: CommentService,
  ) {}

  @Post()
  async create(
    @Req() req,
    @Body() createArticleDto: CreateArticleDto,
  ): Promise<Article> {
    createArticleDto.author = req.user.id;

    return await this.articleService.create(createArticleDto);
  }

  @Get()
  async paginate(
    @Req() req,
    @Query('type') type: string,
    @Query('author') author: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<Pagination<Article>> {
    paginationDto.query = {};
    if (type) paginationDto.query['type'] = type;
    if (author) paginationDto.query['author'] = author;

    return await this.articleService.paginate(paginationDto, req.user);
  }

  @Get(':id')
  async findOne(@Req() req, @Param('id') id: number): Promise<Article> {
    return await this.articleService.findOne(id, req.user);
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

  @Put('/:id/favorite')
  async favorite(@Req() req, @Param('id') id: number) {
    return await this.articleService.favorite(req.user, id);
  }

  @Put('/:id/collect')
  async collect(@Req() req, @Param('id') id: number) {
    return await this.articleService.collect(req.user, id);
  }

  @Post('/:id/comment')
  async createComment(
    @Req() req,
    @Param('id') id: number,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    createCommentDto.article = id;
    createCommentDto.author = req.user.id;

    return await this.commentService.create(createCommentDto);
  }

  @Get('/:id/comment')
  async paginateComment(
    @Param('id') id: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<Pagination<Comment>> {
    paginationDto.query = {
      article: id,
      replyTo: null,
    };

    return await this.commentService.paginate(paginationDto);
  }
}
