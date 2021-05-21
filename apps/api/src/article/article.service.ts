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

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
    @InjectRepository(Resource)
    private readonly resourceRepo: Repository<Resource>,
    private readonly collectService: CollectService,
  ) {}

  async create(createArticleDto: CreateArticleDto): Promise<Article> {
    if (createArticleDto.images) {
      const images = await this.resourceRepo.findByIds(createArticleDto.images);
      createArticleDto.images = images;
    }
    const articleData = this.articleRepo.create(createArticleDto);

    return await this.articleRepo.save(articleData);
  }

  async paginate(
    paginationDto: PaginationDto,
    user?: any,
  ): Promise<Pagination<any>> {
    const { page, limit, query } = paginationDto;

    const queryBuilder = getRepository(Article)
      .createQueryBuilder('article')
      // .leftJoinAndSelect('article.images', 'resource')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoin('article.comments', 'comments')
      .addSelect('COUNT(comments.id) as comments')
      .where(query)
      .groupBy('article.id')
      .orderBy('article.id', 'DESC');
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
          item.isFavorite = false;
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
      data.isFavorite = false;
    }

    return data;
  }

  async update(id: number, updateArticleDto: UpdateArticleDto) {
    return await this.articleRepo.update(id, updateArticleDto);
  }

  async remove(id: number) {
    return await this.articleRepo.delete(id);
  }

  async favorite(user: any, id: number) {
    const article: Article = await this.findOne(id);
    article.favorite++;
    return await this.articleRepo.save(article);
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
