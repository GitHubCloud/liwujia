import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { getRepository, In, Repository } from 'typeorm';
import { CollectService } from '../collect/collect.service';
import { PaginationDto } from '../pagination.dto';
import { Resource } from '../resource/entities/resource.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import * as _ from 'lodash';
import { Order } from '../order/entities/order.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Resource)
    private readonly resourceRepo: Repository<Resource>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
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

  async findOne(condition: any, user?: any): Promise<Product> {
    const product = await this.productRepo.findOne(condition);
    if (user) {
      product.isCollected = !_.isEmpty(
        await this.collectService.findOne({
          collector: user.id,
          product: product.id,
        }),
      );
      product.isFavorite = false;
    }

    return product;
  }

  async update(condition: any, updateProductDto: UpdateProductDto, user?: any) {
    const product = await this.findOne(condition);
    if (!product || product.owner.id !== user?.id) {
      throw new HttpException('无权进行操作', 400);
    }

    const exists = await this.orderRepo.findOne({
      product: product,
    });
    if (exists) {
      throw new HttpException('物品已锁定，无法编辑', HttpStatus.BAD_REQUEST);
    }

    if (updateProductDto.images) {
      const images = await this.resourceRepo.find({
        where: {
          id: In(updateProductDto.images),
        },
      });
      updateProductDto.images = images;
    }

    const dto = {
      ...product,
      ...updateProductDto,
    };
    return await this.productRepo.save(dto);

    // return await this.productRepo.update(condition, updateProductDto);
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

  async remove(id: number) {
    return await this.productRepo.delete(id);
  }
}
