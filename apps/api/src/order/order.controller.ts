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
      throw new HttpException('???????????????', 400);
    }
    if (![order.seller.id, order.buyer.id].includes(req.user.id)) {
      throw new HttpException('??????????????????', 400);
    }

    // ????????????????????????????????????
    // ????????????????????????????????????
    let param: any = id;
    if (req.user.id === order.seller.id) {
      param = { product: order.product, status: Not(OrderStatus.CANCELED) };
      const orders = await this.orderService.find(param);
      orders.map((i) => {
        this.messageService.create({
          to: i.buyer.id,
          content: '???????????????????????????',
          order: i.id,
        });
      });
    } else {
      this.messageService.create({
        to: order.seller.id,
        content: '???????????????????????????',
        order: order.id,
      });
    }

    return await this.orderService.update(param, {
      status: OrderStatus.CANCELED,
    });
  }

  // ??????????????????
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
      throw new HttpException('??????????????????', HttpStatus.BAD_REQUEST);
    }

    // ???????????????????????????
    const prevOrder = await this.orderService.findOne({
      product: order.product,
      status: OrderStatus.ONGOING,
    });
    this.eventEmitter.emit('product.replaceBuyer', prevOrder);

    // ??????????????????????????????????????????????????????
    await this.orderService.update(
      { product: order.product, status: OrderStatus.ONGOING },
      { status: OrderStatus.INIT },
    );

    this.messageService.create({
      to: order.buyer.id,
      content: '????????????????????????',
      order: order.id,
    });

    return await this.orderService.update(order.id, {
      status: OrderStatus.ONGOING,
    });
  }

  // ??????????????????
  @Put(':id/delivered')
  async delivered(@Req() req, @Param('id') id: number) {
    const order = await this.orderService.findOne({
      id,
      status: OrderStatus.ONGOING,
    });
    if (!order || req.user.id !== order.buyer.id) {
      throw new HttpException('??????????????????', HttpStatus.BAD_REQUEST);
    }

    // ?????????????????????????????????
    const orders = await this.orderService.find({
      id: Not(order.id),
      product: order.product,
      status: Not(OrderStatus.CANCELED),
    });
    orders.map((i) => {
      this.messageService.create({
        to: i.buyer.id,
        content: '????????????????????????????????????',
        order: i.id,
      });
    });
    await this.orderService.update(
      { id: In(orders.map((i) => i.id)) },
      { status: OrderStatus.CANCELED },
    );

    this.messageService.create({
      to: order.seller.id,
      content: '????????????????????????????????????',
      order: order.id,
    });

    return await this.orderService.update(id, {
      status: OrderStatus.DELIVERED,
    });
  }

  // ????????????????????????
  @Put(':id/complete')
  async complete(@Req() req, @Param('id') id: number) {
    const order = await this.orderService.findOne({
      id,
      // ??????????????????????????????????????????????????????
      status: In([
        OrderStatus.ONGOING,
        OrderStatus.DELIVERED,
        OrderStatus.RECEIVED,
      ]),
    });

    if (
      !order ||
      ![order.buyer.id, order.seller.id].includes(Number(req.user.id))
    ) {
      throw new HttpException('??????????????????', HttpStatus.BAD_REQUEST);
    }

    await this.productService.setToSold(order.product.id);
    this.eventEmitter.emit('product.sold', order.seller);
    this.eventEmitter.emit('product.bought', order.buyer);

    // ?????????????????????????????????
    const orders = await this.orderService.find({
      id: Not(order.id),
      product: order.product,
      status: Not(OrderStatus.CANCELED),
    });
    orders.map((i) => {
      this.messageService.create({
        to: i.buyer.id,
        content: '????????????????????????????????????',
        order: i.id,
      });
    });
    await this.orderService.update(
      { id: In(orders.map((i) => i.id)) },
      { status: OrderStatus.CANCELED },
    );

    this.messageService.create({
      to: req.user.id == order.buyer.id ? order.seller.id : order.buyer.id,
      content:
        req.user.id == order.buyer.id
          ? '???????????????????????????'
          : '???????????????????????????',
      order: order.id,
    });

    return await this.orderService.update(id, {
      status: OrderStatus.COMPLETE,
    });
  }
}
