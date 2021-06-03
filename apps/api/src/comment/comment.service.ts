import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getRepository, Repository } from 'typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './entities/comment.entity';
import { PaginationDto } from 'apps/api/src/pagination.dto';
import { EventEmitter2 } from 'eventemitter2';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
  ) {}

  async create(createCommentDto: CreateCommentDto): Promise<Comment> {
    let parentComment = null;
    if (!createCommentDto.article && createCommentDto.replyTo) {
      parentComment = await this.commentRepo.findOne(createCommentDto.replyTo, {
        loadRelationIds: true,
      });
      createCommentDto.article = parentComment.article;
      createCommentDto.product = parentComment.product;
    }

    return await this.commentRepo.save(
      this.commentRepo.create(createCommentDto),
    );
  }

  async paginate(
    paginationDto: PaginationDto,
    user?: any,
  ): Promise<Pagination<Comment>> {
    const { page, limit, query } = paginationDto;

    const queryBuilder = getRepository(Comment)
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author');

    if (query) {
      queryBuilder.leftJoinAndSelect('comment.replys', 'replys');
      queryBuilder.leftJoinAndSelect(
        'replys.author',
        'replys.author',
        '`replys.author`.id = replys.author',
      );
      queryBuilder.where(query);
    } else {
      // 评论消息
      queryBuilder.leftJoinAndSelect('comment.product', 'product');
      queryBuilder.leftJoinAndSelect('product.owner', 'productOwner');
      queryBuilder.leftJoinAndSelect('comment.article', 'article');
      queryBuilder.leftJoinAndSelect('article.author', 'articleAuthor');
      queryBuilder.leftJoinAndSelect('comment.replyTo', 'replyTo');
      queryBuilder.leftJoinAndSelect('replyTo.author', 'replyToAuthor');
      queryBuilder.where('comment.author != :userid', { userid: user.id });
      queryBuilder.andWhere(
        '(product.owner = :userid OR article.author = :userid OR replyTo.author = :userid)',
        { userid: user.id },
      );
      queryBuilder.orderBy('comment.id', 'DESC');
    }

    return await paginate(queryBuilder, { page, limit });
  }

  async findOne(id: number): Promise<Comment> {
    return await this.commentRepo.findOne(id);
  }
}
