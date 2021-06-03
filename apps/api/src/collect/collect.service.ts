import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { getRepository, Repository } from 'typeorm';
import { PaginationDto } from '../pagination.dto';
import { CreateCollectDto } from './dto/create-collect.dto';
import { Collect } from './entities/collect.entity';

@Injectable()
export class CollectService {
  constructor(
    @InjectRepository(Collect)
    private readonly collectRepo: Repository<Collect>,
  ) {}

  async create(createCollectDto: CreateCollectDto): Promise<Collect> {
    return await this.collectRepo.save(
      this.collectRepo.create(createCollectDto),
    );
  }

  async paginate(
    paginationDto: PaginationDto,
    schema: string,
    user?: any,
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
        queryBuilder.leftJoinAndSelect('article.images', 'articleImages');
        queryBuilder.leftJoinAndSelect('collect.product', 'product');
        queryBuilder.leftJoinAndSelect('product.images', 'productImages');
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
    return await this.collectRepo.delete(id);
  }
}
