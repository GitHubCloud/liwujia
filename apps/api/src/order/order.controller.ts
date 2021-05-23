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
import { In } from 'typeorm';

@ApiTags('Order')
@Controller('order')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(AuthGuard('jwt'))
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

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
  async findOne(@Param('id') id: number): Promise<Order> {
    return await this.orderService.findOne(id);
  }

  @Put(':id/cancel')
  async cancel(@Req() req, @Param('id') id: number) {
    const order = await this.orderService.findOne(id);
    if (!order) throw new HttpException('订单不存在', 400);
    // 卖家取消，则取消所有订单
    // 买家取消，则取消单笔订单
    let param: any = id;
    if (req.user.id === order.seller.id) {
      param = { product: order.product };
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

    await this.orderService.update(
      { product: order.product },
      { status: OrderStatus.CANCELED },
    );

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
    if (!order || req.user.id !== order.seller.id) {
      throw new HttpException('无权进行操作', HttpStatus.BAD_REQUEST);
    }

    return await this.orderService.update(id, {
      status: OrderStatus.COMPLETE,
    });
  }
}
