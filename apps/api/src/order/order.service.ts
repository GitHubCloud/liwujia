import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { getRepository, In, Not, Repository } from 'typeorm';
import { PaginationDto } from '../pagination.dto';
import { ProductService } from '../product/product.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import * as _ from 'lodash';
import { OrderRoles } from './orderRoles.enum';
import { OrderStatus } from './orderStatus.enum';
import { MessageService } from '../message/message.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly productService: ProductService,
    private readonly messageService: MessageService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const product = await this.productService.findOne(createOrderDto.product);
    createOrderDto.seller = product.owner;

    if (createOrderDto.seller.id === createOrderDto.buyer.id) {
      throw new HttpException('不能购买自己的闲置', HttpStatus.BAD_REQUEST);
    }

    let exists = await this.findOne({
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

    exists = await this.findOne({
      product,
      buyer: createOrderDto.buyer,
    });

    let result = null;
    if (exists && exists.status === OrderStatus.CANCELED) {
      exists.status = OrderStatus.INIT;
      result = await this.orderRepo.save(exists);
    } else {
      result = await this.orderRepo.save(this.orderRepo.create(createOrderDto));
    }

    this.messageService.create({
      to: result.seller.id,
      content: '您的订单有新的买家',
      order: result.id,
    });

    return result;
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
      .leftJoinAndSelect('product.images', 'images')
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
      // TODO: 买家加上购买成功次数和卖出成功次数
      const buyers = await this.orderRepo.find({
        where: {
          product: In(ids),
          status: Not(OrderStatus.CANCELED),
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

  async find(condition: any): Promise<Order[]> {
    return await this.orderRepo.find(condition);
  }

  async findOne(condition: any): Promise<Order> {
    return await this.orderRepo.findOne(condition);
  }

  async update(condition: any, updateOrderDto: UpdateOrderDto) {
    return await this.orderRepo.update(condition, updateOrderDto);
  }
}
