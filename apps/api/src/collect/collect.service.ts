import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from 'nestjs-redis';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { getRepository, Repository } from 'typeorm';
import { Article } from '../article/entities/article.entity';
import { PaginationDto } from '../pagination.dto';
import { Product } from '../product/entities/product.entity';
import { CreateCollectDto } from './dto/create-collect.dto';
import { Collect } from './entities/collect.entity';

@Injectable()
export class CollectService {
  constructor(
    @InjectRepository(Collect)
    private readonly collectRepo: Repository<Collect>,
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly redisService: RedisService,
  ) {}

  private redisClient = this.redisService.getClient();

  async create(createCollectDto: CreateCollectDto): Promise<Collect> {
    const collect = await this.collectRepo.save(
      this.collectRepo.create(createCollectDto),
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
    await this.redisClient.incr(`message:collect:${targetUser}`);

    return collect;
  }

  async paginate(
    paginationDto: PaginationDto,
    schema: string,
    user: any,
  ): Promise<Pagination<any>> {
    const { page, limit, query } = paginationDto;

    const queryBuilder = getRepository(Collect)
      .createQueryBuilder('collect')
      .leftJoinAndSelect('collect.collector', 'collector');
    switch (schema) {
      case 'product':
        queryBuilder.leftJoinAndSelect('collect.product', 'product');
        queryBuilder.leftJoinAndSelect('product.images', 'images');
        queryBuilder.where('collect.product IS NOT NULL');
        break;
      case 'article':
        queryBuilder.leftJoinAndSelect('collect.article', 'article');
        queryBuilder.leftJoinAndSelect('article.images', 'images');
        queryBuilder.where('collect.article IS NOT NULL');
        if (query.type) {
          queryBuilder.andWhere('article.type = :type', { type: query.type });
        }
        break;
      default:
        queryBuilder.leftJoinAndSelect('collect.article', 'article');
        queryBuilder.leftJoinAndSelect('article.author', 'articleAuthor');
        queryBuilder.leftJoinAndSelect('article.images', 'articleImages');
        queryBuilder.leftJoinAndSelect('collect.product', 'product');
        queryBuilder.leftJoinAndSelect('product.owner', 'productOwner');
        queryBuilder.leftJoinAndSelect('product.images', 'productImages');
        queryBuilder.where('article.author = :userid', { userid: user.id });
        queryBuilder.orWhere('product.owner = :userid', { userid: user.id });
        this.redisClient.set(`message:collect:${user.id}`, 0);
        break;
    }
    if (schema && user) {
      queryBuilder.andWhere('collect.collector = :userid', { userid: user.id });
    }
    queryBuilder.orderBy('collect.id', 'DESC');

    return await paginate(queryBuilder, { page, limit });
  }

  async findOne(query: any): Promise<Collect> {
    return await this.collectRepo.findOne({
      where: query,
    });
  }

  async remove(id: number) {
    const collect = await this.collectRepo.findOne(id, {
      loadRelationIds: true,
    });

    // 消息数量缓存
    let targetUser = null;
    if (collect.article) {
      const article = await this.articleRepo.findOne(collect.article, {
        loadRelationIds: true,
      });
      targetUser = article.author;
    }
    if (collect.product) {
      const product = await this.productRepo.findOne(collect.product, {
        loadRelationIds: true,
      });
      targetUser = product.owner;
    }
    await this.redisClient.decr(`message:collect:${targetUser}`);

    return await this.collectRepo.delete(id);
  }
}
