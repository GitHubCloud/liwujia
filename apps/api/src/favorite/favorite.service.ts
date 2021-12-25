import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from 'nestjs-redis';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { getRepository, Repository } from 'typeorm';
import { Article } from '../article/entities/article.entity';
import { Comment } from '../comment/entities/comment.entity';
import { PaginationDto } from '../pagination.dto';
import { Product } from '../product/entities/product.entity';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { Favorite } from './entities/favorite.entity';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    private readonly redisService: RedisService,
  ) {}

  private redisClient = this.redisService.getClient();

  async create(createCollectDto: CreateFavoriteDto): Promise<Favorite> {
    const favorite = await this.favoriteRepo.save(
      this.favoriteRepo.create(createCollectDto),
    );

    // 消息数量缓存
    let targetUser = null;
    if (createCollectDto.article) {
      const article = await this.articleRepo.findOne(createCollectDto.article, {
        loadRelationIds: true,
      });
      targetUser = article.author;
    }
    if (createCollectDto.product) {
      const product = await this.productRepo.findOne(createCollectDto.product, {
        loadRelationIds: true,
      });
      targetUser = product.owner;
    }
    if (createCollectDto.comment) {
      const comment = await this.commentRepo.findOne(createCollectDto.comment, {
        loadRelationIds: true,
      });
      targetUser = comment.author;
    }
    await this.redisClient.incr(`message:favorite:${targetUser}`);

    return favorite;
  }

  async paginate(
    paginationDto: PaginationDto,
    schema: string,
    user: any,
  ): Promise<Pagination<any>> {
    const { page, limit, query } = paginationDto;

    const queryBuilder = getRepository(Favorite)
      .createQueryBuilder('favorite')
      .leftJoinAndSelect('favorite.user', 'user');
    switch (schema) {
      case 'product':
        queryBuilder.leftJoinAndSelect('favorite.product', 'product');
        queryBuilder.leftJoinAndSelect('product.images', 'images');
        queryBuilder.where('favorite.product IS NOT NULL');
        break;
      case 'article':
        queryBuilder.leftJoinAndSelect('favorite.article', 'article');
        queryBuilder.leftJoinAndSelect('article.images', 'images');
        queryBuilder.where('favorite.article IS NOT NULL');
        if (query.type) {
          queryBuilder.andWhere('article.type = :type', { type: query.type });
        }
        break;
      case 'comment':
        queryBuilder.leftJoinAndSelect('favorite.comment', 'comment');
        queryBuilder.where('favorite.comment IS NOT NULL');
        break;
      default:
        queryBuilder.leftJoinAndSelect('favorite.article', 'article');
        queryBuilder.leftJoinAndSelect('article.author', 'articleAuthor');
        queryBuilder.leftJoinAndSelect('article.images', 'articleImages');
        queryBuilder.leftJoinAndSelect('favorite.product', 'product');
        queryBuilder.leftJoinAndSelect('product.owner', 'productOwner');
        queryBuilder.leftJoinAndSelect('product.images', 'productImages');
        queryBuilder.where('article.author = :userid', { userid: user.id });
        queryBuilder.orWhere('product.owner = :userid', { userid: user.id });
        this.redisClient.set(`message:favorite:${user.id}`, 0);
        break;
    }
    if (schema && user) {
      queryBuilder.andWhere('favorite.user = :userid', { userid: user.id });
    }
    queryBuilder.orderBy('favorite.id', 'DESC');

    return await paginate(queryBuilder, { page, limit });
  }

  async findOne(condition: any): Promise<Favorite> {
    return await this.favoriteRepo.findOne(condition);
  }

  async remove(id: number) {
    const favorite = await this.favoriteRepo.findOne(id, {
      loadRelationIds: true,
    });

    // 消息数量缓存
    let targetUser = null;
    if (favorite.article) {
      const article = await this.articleRepo.findOne(favorite.article, {
        loadRelationIds: true,
      });
      targetUser = article.author;
    }
    if (favorite.product) {
      const product = await this.productRepo.findOne(favorite.product, {
        loadRelationIds: true,
      });
      targetUser = product.owner;
    }
    if (favorite.comment) {
      const comment = await this.commentRepo.findOne(favorite.comment, {
        loadRelationIds: true,
      });
      targetUser = comment.author;
    }
    await this.redisClient.decr(`message:favorite:${targetUser}`);

    return await this.favoriteRepo.delete(id);
  }
}
