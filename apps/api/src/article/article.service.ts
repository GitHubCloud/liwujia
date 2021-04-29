import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getRepository, Repository } from 'typeorm';
import { paginateRawAndEntities, Pagination } from 'nestjs-typeorm-paginate';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from './entities/article.entity';
import { PaginationDto } from 'apps/api/src/pagination.dto';
import { ArticleTypes } from './articleType.enum';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
  ) {}

  async create(createArticleDto: CreateArticleDto): Promise<Article> {
    createArticleDto.type = createArticleDto.type || ArticleTypes.交流;

    return await this.articleRepo.save(
      this.articleRepo.create(createArticleDto),
    );
  }

  async paginate(paginationDto: PaginationDto): Promise<Pagination<any>> {
    const { page, limit, query } = paginationDto;

    const queryBuilder = getRepository(Article)
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoin('article.comments', 'comments')
      .addSelect('COUNT(comments.id) as comments')
      .where(query)
      .groupBy('article.id');
    const [pagination, rawResults] = await paginateRawAndEntities(
      queryBuilder,
      { page, limit },
    );

    pagination.items.map((item, index) => {
      const raw = rawResults[index];
      item.comments = Number(raw.comments);
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
