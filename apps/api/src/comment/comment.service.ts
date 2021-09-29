import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getRepository, Repository } from 'typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './entities/comment.entity';
import { PaginationDto } from 'apps/api/src/pagination.dto';
import { EventEmitter2 } from 'eventemitter2';
import { RedisService } from 'nestjs-redis';
import { Article } from '../article/entities/article.entity';
import { Product } from '../product/entities/product.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private redisClient = this.redisService.getClient();

  async create(createCommentDto: CreateCommentDto): Promise<Comment> {
    let parentComment = null;
    if (!createCommentDto.article && createCommentDto.replyTo) {
      parentComment = await this.commentRepo.findOne(createCommentDto.replyTo, {
        loadRelationIds: true,
      });
      createCommentDto.article = parentComment.article;
      createCommentDto.product = parentComment.product;
    }

    const comment = await this.commentRepo.save(
      this.commentRepo.create(createCommentDto),
    );
    this.eventEmitter.emit('comment.create', createCommentDto.author);

    // 消息数量缓存
    let targetUser = null;
    if (parentComment) {
      targetUser = parentComment.author;
    } else {
      if (createCommentDto.article) {
        const article = await this.articleRepo.findOne(
          createCommentDto.article,
          { loadRelationIds: true },
        );
        targetUser = article.author;
      }
      if (createCommentDto.product) {
        const product = await this.productRepo.findOne(
          createCommentDto.product,
          { loadRelationIds: true },
        );
        targetUser = product.owner;
      }
    }
    if (!parentComment || parentComment.author != createCommentDto.author) {
      await this.redisClient.incr(`message:comment:${targetUser}`);
    }

    return comment;
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
      // queryBuilder.where('comment.author != :userid', { userid: user.id });
      queryBuilder.andWhere(
        '(product.owner = :userid OR article.author = :userid OR replyTo.author = :userid)',
        { userid: user.id },
      );
      queryBuilder.orderBy('comment.id', 'DESC');
      this.redisClient.set(`message:comment:${user.id}`, 0);
    }

    return await paginate(queryBuilder, { page, limit });
  }

  async findOne(id: number): Promise<Comment> {
    return await this.commentRepo.findOne(id);
  }
}
