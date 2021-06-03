import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { getRepository, Repository } from 'typeorm';
import { PaginationDto } from '../pagination.dto';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { Favorite } from './entities/favorite.entity';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>
  ) {}

  async create(createCollectDto: CreateFavoriteDto): Promise<Favorite> {
    const favorite = await this.favoriteRepo.save(
      this.favoriteRepo.create(createCollectDto),
    );

    return favorite;
  }

  async paginate(
    paginationDto: PaginationDto,
    schema: string,
    user?: any,
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
      default:
        queryBuilder.leftJoinAndSelect('favorite.article', 'article');
        queryBuilder.leftJoinAndSelect('article.images', 'articleImages');
        queryBuilder.leftJoinAndSelect('favorite.product', 'product');
        queryBuilder.leftJoinAndSelect('product.images', 'productImages');
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
    return await this.favoriteRepo.delete(id);
  }
}
