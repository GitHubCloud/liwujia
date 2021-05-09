import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, paginateRawAndEntities, Pagination } from 'nestjs-typeorm-paginate';
import { getRepository, IsNull, Not, Repository } from 'typeorm';
import { PaginationDto } from '../pagination.dto';
import { CreateCollectDto } from './dto/create-collect.dto';
import { Collect } from './entities/collect.entity';

@Injectable()
export class CollectService {
  constructor(
    @InjectRepository(Collect)
    private readonly collectRepo: Repository<Collect>
  ) { }

  async create(createCollectDto: CreateCollectDto): Promise<Collect> {
    return await this.collectRepo.save(
      this.collectRepo.create(createCollectDto)
    );
  }

  async paginate(paginationDto: PaginationDto): Promise<Pagination<any>> {
    const { page, limit, query } = paginationDto;

    const queryBuilder = getRepository(Collect)
      .createQueryBuilder('collect')
      .leftJoinAndSelect('collect.article', 'article')
      .leftJoinAndSelect('article.images', 'images')
      .leftJoinAndSelect('collect.collector', 'collector')
      .where('collect.article IS NOT NULL');
    if(query.type){
      queryBuilder.andWhere('article.type = :type', { type: query.type });
    }
    queryBuilder.orderBy('collect.id', 'DESC');

    const [pagination, rawResults] = await paginateRawAndEntities(
      queryBuilder,
      { page, limit },
    );

    return pagination;
  }

  async findOne(query: any): Promise<Collect>{
    return await this.collectRepo.findOne({
      where: query
    })
  }

  async remove(id: number) {
    return await this.collectRepo.delete(id);
  }
}
