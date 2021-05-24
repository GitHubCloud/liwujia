import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { getRepository, In, Repository } from 'typeorm';
import { PaginationDto } from '../pagination.dto';
import { ProductService } from '../product/product.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import * as _ from 'lodash';
import { OrderRoles } from './orderRoles.enum';
import { OrderStatus } from './orderStatus.enum';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly productService: ProductService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const product = await this.productService.findOne(createOrderDto.product);
    createOrderDto.seller = product.owner;

    if (createOrderDto.seller.id === createOrderDto.buyer.id) {
      throw new HttpException('不能购买自己的闲置', HttpStatus.BAD_REQUEST);
    }

    const exists = await this.findOne({
      product,
      status: In([
        OrderStatus.ONGOING,
        OrderStatus.DELIVERED,
        OrderStatus.RECEIVED,
        OrderStatus.COMPLETE,
      ]),
    });
    if (exists) {
      throw new HttpException('该闲置有交易正在进行', 400);
    }

    return await this.orderRepo.save(this.orderRepo.create(createOrderDto));
  }

  async paginate(
    paginationDto: PaginationDto,
    role?: OrderRoles,
    user?: any,
  ): Promise<Pagination<Order>> {
    const { page, limit, query = {} } = paginationDto;

    const queryBuilder = getRepository(Order)
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.product', 'product')
      .leftJoinAndSelect('order.seller', 'seller')
      .leftJoinAndSelect('order.buyer', 'buyer');

    switch (role) {
      case OrderRoles.BUYER:
        query['buyer'] = user.id;
        break;
      case OrderRoles.SELLER:
        query['seller'] = user.id;
        queryBuilder.groupBy('order.product');
        break;
    }

    queryBuilder.where(query).orderBy('order.id', 'DESC');

    const pagination = await paginate(queryBuilder, { page, limit });

    if (role === OrderRoles.SELLER) {
      const ids = pagination.items.map((i) => i.product.id);
      const buyers = await this.orderRepo.find({
        where: {
          product: In(ids),
        },
      });
      pagination.items.map(async (item) => {
        if (item.status === OrderStatus.INIT) {
          item.buyers = _.filter(
            _.map(buyers, (i) => {
              if (i.product.id == item.product.id) return i.buyer;
            }),
            (i) => i,
          );
          delete item.buyer;
        }
      });
    }

    return pagination;
  }

  async findOne(condition: any): Promise<Order> {
    return await this.orderRepo.findOne(condition);
  }

  async update(condition: any, updateOrderDto: UpdateOrderDto) {
    return await this.orderRepo.update(condition, updateOrderDto);
  }
}
