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
import { GroupOrder } from '../group-order/entities/group-order.entity';
import { FavoriteService } from '../favorite/favorite.service';
import * as _ from 'lodash';
import { User } from '../user/entities/user.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(GroupOrder)
    private readonly groupOrderRepo: Repository<GroupOrder>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly redisService: RedisService,
    private readonly favoriteService: FavoriteService,
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
      createCommentDto.groupOrder = parentComment.groupOrder;
    }

    let comment = await this.commentRepo.save(
      this.commentRepo.create(createCommentDto),
    );
    comment = await this.commentRepo.findOne(comment.id);

    // 消息数量缓存
    let targetUser = null;
    if (parentComment) {
      if (createCommentDto.author != parentComment.author) {
        targetUser = await this.userRepo.findOne(parentComment.author);
      }
    } else {
      if (createCommentDto.article) {
        const article = await this.articleRepo.findOne(
          createCommentDto.article,
        );
        if (createCommentDto.author != (<any>article).author.id) {
          targetUser = article.author;
        }
      }
      if (createCommentDto.product) {
        const product = await this.productRepo.findOne(
          createCommentDto.product,
        );
        if (createCommentDto.author != (<any>product).owner.id) {
          targetUser = product.owner;
        }
      }
      if (createCommentDto.groupOrder) {
        const groupOrder = await this.groupOrderRepo.findOne(
          createCommentDto.groupOrder,
        );
        if (createCommentDto.author != (<any>groupOrder).initiator.id) {
          targetUser = groupOrder.initiator;
        }
      }
    }

    if (targetUser) {
      comment.article = createCommentDto.article;
      comment.product = createCommentDto.product;
      comment.groupOrder = createCommentDto.groupOrder;
      this.eventEmitter.emit('comment.create', targetUser, comment);
      await this.redisClient.incr(`message:comment:${targetUser.id}`);
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
      .leftJoinAndSelect('comment.image', 'image')
      .leftJoinAndSelect('comment.author', 'author');

    if (query) {
      queryBuilder.leftJoinAndSelect('comment.replys', 'replys');
      queryBuilder.leftJoinAndSelect('replys.image', 'replysImage');
      queryBuilder.leftJoinAndSelect(
        'replys.author',
        'replys.author',
        '`replys.author`.id = replys.author',
      );
      queryBuilder.where(query);
    } else {
      // 评论消息
      queryBuilder.leftJoinAndSelect('comment.article', 'article');
      queryBuilder.leftJoinAndSelect('article.author', 'articleAuthor');
      queryBuilder.leftJoinAndSelect('article.images', 'articleImages');
      queryBuilder.leftJoinAndSelect('comment.product', 'product');
      queryBuilder.leftJoinAndSelect('product.owner', 'productOwner');
      queryBuilder.leftJoinAndSelect('product.images', 'productImages');
      queryBuilder.leftJoinAndSelect('comment.groupOrder', 'groupOrder');
      queryBuilder.leftJoinAndSelect('groupOrder.images', 'groupOrderImages');
      queryBuilder.leftJoinAndSelect(
        'groupOrder.initiator',
        'groupOrderInitiator',
      );
      queryBuilder.leftJoinAndSelect('comment.replyTo', 'replyTo');
      queryBuilder.leftJoinAndSelect('replyTo.author', 'replyToAuthor');
      // queryBuilder.where('comment.author != :userid', { userid: user.id });
      queryBuilder.andWhere(
        `(
          (replyTo.id IS NULL AND article.author = :userid) OR
          (replyTo.id IS NULL AND product.owner = :userid) OR
          (replyTo.id IS NULL AND groupOrder.initiator = :userid) OR
          replyTo.author = :userid
        )`,
        { userid: user.id },
      );
      this.redisClient.set(`message:comment:${user.id}`, 0);
    }

    queryBuilder.orderBy('comment.id', 'DESC');
    const pagination = await paginate(queryBuilder, { page, limit });
    await Promise.all(
      pagination.items.map(async (item, index) => {
        if (user) {
          item.isFavorite = !_.isEmpty(
            await this.favoriteService.findOne({
              user: user.id,
              comment: item.id,
            }),
          );
        }
      }),
    );

    return pagination;
  }

  async findOne(id: number): Promise<Comment> {
    return await this.commentRepo.findOne(id);
  }

  async delete(id: number): Promise<any> {
    return await this.commentRepo.softDelete(id);
  }

  async favorite(user: any, id: number) {
    const comment: Comment = await this.findOne(id);

    const exists = await this.favoriteService.findOne({
      user: user.id,
      comment: comment.id,
    });
    if (_.isEmpty(exists)) {
      await this.favoriteService.create({
        user: user.id,
        comment: comment.id,
      });
      await this.commentRepo.increment({ id }, 'favorite', 1);
    } else {
      await this.favoriteService.remove(exists.id);
      await this.commentRepo.decrement({ id }, 'favorite', 1);
    }
  }
}
