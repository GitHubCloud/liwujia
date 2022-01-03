import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getRepository, In, Repository } from 'typeorm';
import { paginateRawAndEntities, Pagination } from 'nestjs-typeorm-paginate';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from './entities/article.entity';
import { PaginationDto } from 'apps/api/src/pagination.dto';
import { Resource } from '../resource/entities/resource.entity';
import * as _ from 'lodash';
import { CollectService } from '../collect/collect.service';
import { FavoriteService } from '../favorite/favorite.service';
import { EventEmitter2 } from 'eventemitter2';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
    @InjectRepository(Resource)
    private readonly resourceRepo: Repository<Resource>,
    private readonly collectService: CollectService,
    private readonly favoriteService: FavoriteService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createArticleDto: CreateArticleDto): Promise<Article> {
    if (createArticleDto.images) {
      const images = await this.resourceRepo.findByIds(createArticleDto.images);
      createArticleDto.images = images;
    }
    const article = this.articleRepo.create(createArticleDto);

    this.eventEmitter.emit('article.create', article.author);

    return await this.articleRepo.save(article);
  }

  async paginate(
    paginationDto: PaginationDto,
    withDeleted = false,
    user?: any,
  ): Promise<Pagination<any>> {
    const { page, limit, isRandom, exclude, query } = paginationDto;

    const queryBuilder = getRepository(Article)
      .createQueryBuilder('article')
      // .leftJoinAndSelect('article.images', 'resource')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoin('article.comments', 'comments')
      .addSelect('COUNT(comments.id) as comments')
      .where(query)
      .groupBy('article.id')
      .orderBy('article.orderIndex', 'DESC')
      .addOrderBy('article.id', 'DESC');

    if (withDeleted) {
      queryBuilder.withDeleted();
    }

    const [pagination, rawResults] = await paginateRawAndEntities(
      queryBuilder,
      { page, limit },
    );

    // TODO: replace with a better solution
    const ids = pagination.items.map((i) => i.id);
    const images = await this.articleRepo.find({
      where: {
        id: In(ids),
      },
    });
    await Promise.all(
      pagination.items.map(async (item, index) => {
        const raw = rawResults[index];
        item.comments = Number(raw.comments);
        item.images = _.get(
          _.find(images, (i) => i.id == item.id),
          'images',
          [],
        );

        if (user) {
          item.isCollected = !_.isEmpty(
            await this.collectService.findOne({
              collector: user.id,
              article: item.id,
            }),
          );
          item.isFavorite = !_.isEmpty(
            await this.favoriteService.findOne({
              user: user.id,
              article: item.id,
            }),
          );
        }
      }),
    );

    return pagination;
  }

  async findOne(id: number, user?: any): Promise<Article> {
    const data = await this.articleRepo.findOne(id);

    if (user) {
      data.isCollected = !_.isEmpty(
        await this.collectService.findOne({
          collector: user.id,
          article: data.id,
        }),
      );
      data.isFavorite = !_.isEmpty(
        await this.favoriteService.findOne({
          user: user.id,
          article: data.id,
        }),
      );
    }

    return data;
  }

  async update(id: number, updateArticleDto: UpdateArticleDto) {
    const article = await this.articleRepo.findOne(id);

    if (updateArticleDto.images) {
      const images = await this.resourceRepo.find({
        where: {
          id: In(updateArticleDto.images),
        },
      });
      updateArticleDto.images = images;
    }
    updateArticleDto.updateTime = new Date();

    const dto = {
      ...article,
      ...updateArticleDto,
    };
    return await this.articleRepo.save(dto);
  }

  async remove(id: number) {
    return await this.articleRepo.softDelete(id);
  }

  async favorite(user: any, id: number) {
    const article: Article = await this.findOne(id);

    const exists = await this.favoriteService.findOne({
      user: user.id,
      article: article.id,
    });
    if (_.isEmpty(exists)) {
      await this.favoriteService.create({
        user: user.id,
        article: article.id,
      });
      await this.articleRepo.increment({ id }, 'favorite', 1);
    } else {
      await this.favoriteService.remove(exists.id);
      await this.articleRepo.decrement({ id }, 'favorite', 1);
    }
  }

  async collect(user: any, id: number) {
    const article: Article = await this.findOne(id);

    const exists = await this.collectService.findOne({
      collector: user.id,
      article: article.id,
    });
    if (_.isEmpty(exists)) {
      await this.collectService.create({
        collector: user.id,
        article: article.id,
      });
      await this.articleRepo.increment({ id }, 'collect', 1);
    } else {
      await this.collectService.remove(exists.id);
      await this.articleRepo.decrement({ id }, 'collect', 1);
    }
  }
}
