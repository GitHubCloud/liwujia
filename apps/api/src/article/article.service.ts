import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from './entities/article.entity';
import { PaginationDto } from 'apps/api/src/pagination.dto';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
  ) {}

  async create(createArticleDto: CreateArticleDto): Promise<Article> {
    return await this.articleRepo.save(
      this.articleRepo.create(createArticleDto),
    );
  }

  async paginate(paginationDto: PaginationDto): Promise<Pagination<Article>> {
    const { page, limit } = paginationDto;
    return await paginate(this.articleRepo, { page, limit });
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
