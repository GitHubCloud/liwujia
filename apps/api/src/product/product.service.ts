import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { getRepository, Repository } from 'typeorm';
import { CollectService } from '../collect/collect.service';
import { PaginationDto } from '../pagination.dto';
import { Resource } from '../resource/entities/resource.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import * as _ from 'lodash';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Resource)
    private readonly resourceRepo: Repository<Resource>,
    private readonly collectService: CollectService,
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

  async paginate(
    paginationDto: PaginationDto,
    user?: any,
  ): Promise<Pagination<Product>> {
    const { page, limit, query } = paginationDto;

    const queryBuilder = getRepository(Product)
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.owner', 'owner')
      .leftJoinAndSelect('product.images', 'images')
      .where(query)
      .orderBy('product.id', 'DESC');

    const pagination = await paginate(queryBuilder, { page, limit });

    await Promise.all(
      pagination.items.map(async (item, index) => {
        if (user) {
          item.isCollected = !_.isEmpty(
            await this.collectService.findOne({
              collector: user.id,
              product: item.id,
            }),
          );
          item.isFavorite = false;
        }
      }),
    );

    return pagination;
  }

  async findOne(id: number): Promise<Product> {
    return await this.productRepo.findOne(id);
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    return await this.productRepo.update(id, updateProductDto);
  }

  async favorite(user: any, id: number) {
    const product: Product = await this.findOne(id);
    product.favorite++;
    return await this.productRepo.save(product);
  }

  async collect(user: any, id: number) {
    const product: Product = await this.findOne(id);

    const exists = await this.collectService.findOne({
      collector: user.id,
      product: product.id,
    });
    if (_.isEmpty(exists)) {
      await this.collectService.create({
        collector: user.id,
        product: product.id,
      });
      await this.productRepo.increment({ id }, 'collect', 1);
    } else {
      await this.collectService.remove(exists.id);
      await this.productRepo.decrement({ id }, 'collect', 1);
    }
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
