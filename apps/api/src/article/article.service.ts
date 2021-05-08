import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getRepository, In, Repository } from 'typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from './entities/article.entity';
import { PaginationDto } from 'apps/api/src/pagination.dto';
import { ArticleTypes } from './articleType.enum';
import { Resource } from '../resource/entities/resource.entity';
import * as _ from 'lodash';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
    @InjectRepository(Resource)
    private readonly resourceRepo: Repository<Resource>,
  ) {}

  async create(createArticleDto: CreateArticleDto): Promise<Article> {
    createArticleDto.type = createArticleDto.type || ArticleTypes.交流;

    if (createArticleDto.images) {
      const images = await this.resourceRepo.findByIds(createArticleDto.images);
      createArticleDto.images = images;
    }
    const articleData = this.articleRepo.create(createArticleDto);

    return await this.articleRepo.save(articleData);
  }

  async paginate(paginationDto: PaginationDto): Promise<Pagination<any>> {
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
    const pagination = await paginate(queryBuilder, {
      page,
      limit,
    });

    // TODO: replace with a better solution
    const ids = pagination.items.map((i) => i.id);
    const images = await this.articleRepo.find({
      where: {
        id: In(ids),
      },
    });
    pagination.items.map((item) => {
      item.images = _.get(
        _.find(images, (i) => i.id == item.id),
        'images',
        [],
      );
    });

    return pagination;
  }

  async findOne(id: number): Promise<Article> {
    return await this.articleRepo.findOne(id);
  }

  async update(id: number, updateArticleDto: UpdateArticleDto) {
    return await this.articleRepo.update(id, updateArticleDto);
  }

  async remove(id: number) {
    return await this.articleRepo.delete(id);
  }

  async favorite(id: number) {
    const article: Article = await this.findOne(id);
    article.favorite++;
    return await this.articleRepo.save(article);
  }
}
