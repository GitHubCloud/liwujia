import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { Pagination } from 'nestjs-typeorm-paginate';
import { PaginationDto } from 'apps/api/src/pagination.dto';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './entities/comment.entity';
import * as _ from 'lodash';

@ApiTags('Comment')
@Controller('comment')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(AuthGuard('jwt'))
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  async paginate(
    @Req() req,
    @Query() paginationDto: PaginationDto,
  ): Promise<Pagination<Comment>> {
    const pagination = await this.commentService.paginate(
      paginationDto,
      req.user,
    );

    pagination.items.map((i) => {
      switch (req.user.id) {
        case _.get(i, 'replyTo.id'):
          _.set(i, 'type', 'comment');
          break;
        case _.get(i, 'article.id'):
          _.set(i, 'type', 'article');
          break;
        case _.get(i, 'product.id'):
          _.set(i, 'type', 'product');
          break;
      }
    });

    return pagination;
  }

  @Post('/:id/reply')
  async reply(
    @Req() req,
    @Param('id') id: number,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    createCommentDto.replyTo = id;
    createCommentDto.author = req.user.id;

    return await this.commentService.create(createCommentDto);
  }

  @Get('/:id/reply')
  async paginateComment(
    @Param('id') id: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<Pagination<Comment>> {
    paginationDto.query = {
      replyTo: id,
    };

    return await this.commentService.paginate(paginationDto);
  }
}
