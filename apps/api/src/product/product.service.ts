import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { getRepository, Repository } from 'typeorm';
import { PaginationDto } from '../pagination.dto';
import { Resource } from '../resource/entities/resource.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Resource)
    private readonly resourceRepo: Repository<Resource>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    if (createProductDto.images) {
      const images = await this.resourceRepo.findByIds(createProductDto.images);
      createProductDto.images = images;
    }

    return await this.productRepo.save(
      this.productRepo.create(createProductDto),
    );
  }

  async paginate(paginationDto: PaginationDto): Promise<Pagination<Product>> {
    const { page, limit, query } = paginationDto;

    const queryBuilder = getRepository(Product)
      .createQueryBuilder('stuff')
      .where(query);

    const pagination = await paginate(queryBuilder, { page, limit });

    return pagination;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
