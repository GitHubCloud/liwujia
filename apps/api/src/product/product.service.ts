import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginateRawAndEntities, Pagination } from 'nestjs-typeorm-paginate';
import { getRepository, In, Not, Repository } from 'typeorm';
import { CollectService } from '../collect/collect.service';
import { PaginationDto } from '../pagination.dto';
import { Resource } from '../resource/entities/resource.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import * as _ from 'lodash';
import { Order } from '../order/entities/order.entity';
import { OrderStatus } from '../order/orderStatus.enum';
import { FavoriteService } from '../favorite/favorite.service';
import { EventEmitter2 } from 'eventemitter2';

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
    private readonly favoriteService: FavoriteService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    if (createProductDto.images) {
      const images = await this.resourceRepo.findByIds(createProductDto.images);
      createProductDto.images = images;
    }

    const result = await this.productRepo.save(
      this.productRepo.create(createProductDto),
    );

    const product = await this.findOne(result.id);
    this.eventEmitter.emit('product.create', product);

    return product;
  }

  async paginate(
    paginationDto: PaginationDto,
    user?: any,
  ): Promise<Pagination<Product>> {
    const {
      page,
      limit,
      query,
      nearest,
      longitude,
      latitude,
      distance,
    } = paginationDto;

    const queryBuilder = getRepository(Product)
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.owner', 'owner')
      .leftJoinAndSelect('product.images', 'images')
      .where(query);

    if (longitude && latitude) {
      queryBuilder.addSelect(
        `(
          6380 * acos (
            cos ( radians(${latitude}) )
            * cos( radians(product.latitude) )
            * cos( radians(product.longitude) - radians(${longitude}) )
            + sin( radians(${latitude}) )
            * sin( radians(product.latitude) )
          )
        )`,
        'distance',
      );
      if (distance) {
        queryBuilder.andWhere(`(
          6380 * acos (
            cos ( radians(${latitude}) )
            * cos( radians(product.latitude) )
            * cos( radians(product.longitude) - radians(${longitude}) )
            + sin( radians(${latitude}) )
            * sin( radians(product.latitude) )
          )
        ) < ${distance}`);
      }
      if (nearest) {
        queryBuilder.addOrderBy(`distance`, 'ASC');
      }
    }

    queryBuilder.groupBy('product.id');
    queryBuilder.addOrderBy('product.id', 'DESC');

    const [pagination, raw] = await paginateRawAndEntities(queryBuilder, {
      page,
      limit,
    });

    await Promise.all(
      pagination.items.map(async (item, index) => {
        const buyers = await this.orderRepo.find({
          where: {
            product: item,
            status: Not(OrderStatus.CANCELED),
          },
        });
        item.buyers = _.map(buyers, (i) => i.buyer);

        if (user) {
          item.isCollected = !_.isEmpty(
            await this.collectService.findOne({
              collector: user.id,
              product: item.id,
            }),
          );
          item.isFavorite = !_.isEmpty(
            await this.favoriteService.findOne({
              user: user.id,
              product: item.id,
            }),
          );
          item.isOrdered = !_.isEmpty(
            await this.orderRepo.findOne({
              product: item,
              status: Not(OrderStatus.CANCELED),
              buyer: user.id,
            }),
          );
        }
        item.isLocked = !_.isEmpty(
          await this.orderRepo.findOne({
            product: item,
            status: Not(OrderStatus.CANCELED),
          }),
        );

        item.distance = raw[index].distance;
      }),
    );

    return pagination;
  }

  async findOne(condition: any, user?: any): Promise<Product> {
    const product = await this.productRepo.findOne(condition);
    if (!product) {
      return product;
    }

    const buyers = await this.orderRepo.find({
      where: {
        product: product,
        status: Not(OrderStatus.CANCELED),
      },
    });
    product.buyers = _.map(buyers, (i) => i.buyer);

    if (user) {
      product.isCollected = !_.isEmpty(
        await this.collectService.findOne({
          collector: user.id,
          product: product.id,
        }),
      );
      product.isFavorite = !_.isEmpty(
        await this.favoriteService.findOne({
          user: user.id,
          product: product.id,
        }),
      );
      product.isOrdered = !_.isEmpty(
        await this.orderRepo.findOne({
          product: product,
          status: Not(OrderStatus.CANCELED),
          buyer: user.id,
        }),
      );
    }
    product.isLocked = !_.isEmpty(
      await this.orderRepo.findOne({
        product: product,
        status: Not(OrderStatus.CANCELED),
      }),
    );

    return product;
  }

  async update(condition: any, updateProductDto: UpdateProductDto, user?: any) {
    const product = await this.findOne(condition);
    if (!product || product.owner.id !== user?.id) {
      throw new HttpException('无权进行操作', 400);
    }

    const exists = await this.orderRepo.findOne({
      product: product,
      status: Not(OrderStatus.CANCELED),
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
  }

  async setToSold(condition: any) {
    const product = await this.findOne(condition);
    product.isSold = true;
    return await this.productRepo.save(product);
  }

  async favorite(user: any, id: number) {
    const product: Product = await this.findOne(id);

    const exists = await this.favoriteService.findOne({
      user: user.id,
      product: product.id,
    });
    if (_.isEmpty(exists)) {
      await this.favoriteService.create({
        user: user.id,
        product: product.id,
      });
      await this.productRepo.increment({ id }, 'favorite', 1);
    } else {
      await this.favoriteService.remove(exists.id);
      await this.productRepo.decrement({ id }, 'favorite', 1);
    }
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

  async remove(condition: any, user?: any) {
    const product = await this.findOne(condition);
    if (!product || product.owner.id !== user?.id) {
      throw new HttpException('无权进行操作', 400);
    }

    const exists = await this.orderRepo.findOne({
      product: product,
      status: Not(OrderStatus.CANCELED),
    });
    if (exists) {
      throw new HttpException('物品已锁定，无法删除', HttpStatus.BAD_REQUEST);
    }

    return await this.productRepo.softDelete(condition);
  }
}
