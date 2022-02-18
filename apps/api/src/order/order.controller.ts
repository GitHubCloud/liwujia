import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Req,
  Query,
  Put,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Order } from './entities/order.entity';
import { PaginationDto } from '../pagination.dto';
import { OrderStatus } from './orderStatus.enum';
import { OrderRoles } from './orderRoles.enum';
import { In, Not } from 'typeorm';
import { ProductService } from '../product/product.service';
import { MessageService } from '../message/message.service';
import { EventEmitter2 } from 'eventemitter2';
import { RedisService } from 'nestjs-redis';

@ApiTags('Order')
@Controller('order')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(AuthGuard('jwt'))
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly productService: ProductService,
    private readonly messageService: MessageService,
    private readonly eventEmitter: EventEmitter2,
    private readonly redisService: RedisService,
  ) {}

  private redisClient = this.redisService.getClient();

  @Post()
  async create(
    @Req() req,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    createOrderDto.buyer = req.user;

    return await this.orderService.create(createOrderDto);
  }

  @Get()
  async paginate(
    @Req() req,
    @Query() paginationDto: PaginationDto,
    @Query('role') role = OrderRoles.BUYER,
    @Query('status') status: OrderStatus,
  ) {
    if (status) {
      paginationDto.query = { status };
    } else {
      paginationDto.query = {
        status: In([
          OrderStatus.INIT,
          OrderStatus.ONGOING,
          OrderStatus.DELIVERED,
          OrderStatus.RECEIVED,
        ]),
      };
    }

    return await this.orderService.paginate(paginationDto, role, req.user);
  }

  @Get(':id')
  async findOne(@Req() req, @Param('id') id: number): Promise<Order> {
    const order = await this.orderService.findOne(id);
    if (!order) return order;

    if ([order?.seller?.id, order?.buyer?.id].includes(req.user.id)) {
      order.notifyUsed = !!(await this.redisClient.hget(
        `subscribe:orderNotify:${order.id}`,
        order?.seller?.id == req.user.id
          ? order?.seller?.wechatOpenID
          : order?.buyer?.wechatOpenID,
      ));
    }

    return order;
  }

  @Put(':id/cancel')
  async cancel(@Req() req, @Param('id') id: number) {
    const order = await this.orderService.findOne(id);
    if (!order || order.status === OrderStatus.COMPLETE) {
      throw new HttpException('订单不存在', 400);
    }
    if (![order.seller.id, order.buyer.id].includes(req.user.id)) {
      throw new HttpException('无权进行操作', 400);
    }

    // 卖家取消，则取消所有订单
    // 买家取消，则取消单笔订单
    let param: any = id;
    if (req.user.id === order.seller.id) {
      param = { product: order.product, status: Not(OrderStatus.CANCELED) };
      const orders = await this.orderService.find(param);
      orders.map((i) => {
        this.messageService.create({
          to: i.buyer.id,
          content: '您的订单被卖家取消',
          order: i.id,
        });
      });
    } else {
      this.messageService.create({
        to: order.seller.id,
        content: '您的订单被买家取消',
        order: order.id,
      });
    }

    return await this.orderService.update(param, {
      status: OrderStatus.CANCELED,
    });
  }

  // 卖家选择买家
  @Put('choseBuyer')
  async choseBuyer(
    @Req() req,
    @Body('product') product: number,
    @Body('buyer') buyer: number,
  ) {
    const order = await this.orderService.findOne({
      product: product,
      buyer: buyer,
      status: OrderStatus.INIT,
    });
    if (!order || req.user.id !== order.seller.id) {
      throw new HttpException('无权进行操作', HttpStatus.BAD_REQUEST);
    }

    // 通知之前选中的买家
    const prevOrder = await this.orderService.findOne({
      product: order.product,
      status: OrderStatus.ONGOING,
    });
    this.eventEmitter.emit('product.replaceBuyer', prevOrder);

    // 将之前卖家选择的订单状态更新为初始化
    await this.orderService.update(
      { product: order.product, status: OrderStatus.ONGOING },
      { status: OrderStatus.INIT },
    );

    this.messageService.create({
      to: order.buyer.id,
      content: '已被卖家选中交易',
      order: order.id,
    });

    return await this.orderService.update(order.id, {
      status: OrderStatus.ONGOING,
    });
  }

  // 买家确认收货
  @Put(':id/delivered')
  async delivered(@Req() req, @Param('id') id: number) {
    const order = await this.orderService.findOne({
      id,
      status: OrderStatus.ONGOING,
    });
    if (!order || req.user.id !== order.buyer.id) {
      throw new HttpException('无权进行操作', HttpStatus.BAD_REQUEST);
    }

    // 将其他未进行的订单关闭
    const orders = await this.orderService.find({
      id: Not(order.id),
      product: order.product,
      status: Not(OrderStatus.CANCELED),
    });
    orders.map((i) => {
      this.messageService.create({
        to: i.buyer.id,
        content: '卖家已和其他买家达成交易',
        order: i.id,
      });
    });
    await this.orderService.update(
      { id: In(orders.map((i) => i.id)) },
      { status: OrderStatus.CANCELED },
    );

    this.messageService.create({
      to: order.seller.id,
      content: '您的订单买家已确认收货。',
      order: order.id,
    });

    return await this.orderService.update(id, {
      status: OrderStatus.DELIVERED,
    });
  }

  // 卖家确认交易完成
  @Put(':id/complete')
  async complete(@Req() req, @Param('id') id: number) {
    const order = await this.orderService.findOne({
      id,
      status: OrderStatus.DELIVERED,
    });
    if (
      !order ||
      ![order.buyer.id, order.seller.id].includes(Number(req.user.id))
    ) {
      throw new HttpException('无权进行操作', HttpStatus.BAD_REQUEST);
    }

    await this.productService.setToSold(order.product.id);
    this.eventEmitter.emit('product.sold', order.seller);
    this.eventEmitter.emit('product.bought', order.buyer);

    this.messageService.create({
      to: order.buyer.id,
      content:
        req.user.id == order.buyer.id
          ? '买家确认订单已完成'
          : '卖家确认订单已完成',
      order: order.id,
    });

    return await this.orderService.update(id, {
      status: OrderStatus.COMPLETE,
    });
  }
}
