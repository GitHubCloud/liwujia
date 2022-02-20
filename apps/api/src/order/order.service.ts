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
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly productService: ProductService,
    private readonly messageService: MessageService,
    private readonly eventEmitter: EventEmitter2,
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
        // OrderStatus.ONGOING,
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

    let result: Order = null;
    if (exists) {
      if (exists.status === OrderStatus.CANCELED) {
        exists.status = OrderStatus.INIT;
        result = await this.orderRepo.save(exists);
      } else {
        throw new HttpException('有交易正在进行', 400);
      }
    } else {
      result = await this.orderRepo.save(this.orderRepo.create(createOrderDto));
    }

    result = await this.findOne({
      product,
      buyer: createOrderDto.buyer,
    });

    this.eventEmitter.emit('order.create', result);

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
      /**
       * @see https://stackoverflow.com/questions/66117005
       * This line NEED to be on top of the `.leftJoinAndSelect` with product.
       */
      .withDeleted()
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
        order: { id: 1 },
      });
      pagination.items.map(async (item) => {
        if ([OrderStatus.INIT, OrderStatus.ONGOING].includes(item.status)) {
          item.buyers = _.filter(
            _.map(buyers, (i) => {
              if (i.product.id == item.product.id) {
                if (i.status !== OrderStatus.INIT) {
                  item.id = i.id;
                  item.buyer = i.buyer;
                  item.status = i.status;
                  item.createTime = i.createTime;
                }
                return i.buyer;
              }
            }),
            (i) => i,
          );
        }

        if (item.status === OrderStatus.INIT) {
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
