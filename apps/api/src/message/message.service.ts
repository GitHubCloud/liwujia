import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getRepository, IsNull, Not, Repository } from 'typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { PaginationDto } from 'apps/api/src/pagination.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './entities/message.entity';
import { OrderService } from '../order/order.service';
import { SocketGateway } from '../socket/socket.gateway';
import { RedisService } from 'nestjs-redis';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly orderService: OrderService,
    private readonly socketGateway: SocketGateway,
    private readonly redisService: RedisService,
  ) {}

  private redisClient = this.redisService.getClient();

  async create(
    createMessageDto: CreateMessageDto,
    user?: any,
  ): Promise<Message> {
    createMessageDto.from = user ? user.id : null;

    // 订单下的沟通
    if (createMessageDto.order) {
      const order = await this.orderService.findOne(createMessageDto.order);
      if (!order) {
        throw new HttpException('订单不存在', 400);
      }
      if (order.seller.id !== user.id && order.buyer.id !== user.id) {
        throw new HttpException('参数不正确', 400);
      }

      if (order.seller.id === user.id) {
        createMessageDto.to = order.buyer.id;
      } else {
        createMessageDto.to = order.seller.id;
      }
      this.redisClient.incr(`message:order:${createMessageDto.to}`);
    } else {
      this.redisClient.incr(`message:system:${createMessageDto.to}`);
    }

    let messageData = await this.messageRepo.save(
      this.messageRepo.create(createMessageDto),
    );
    messageData = await this.messageRepo.findOne(messageData.id);

    if (createMessageDto.order) {
      this.socketGateway.server
        .to(`order:${createMessageDto.order}`)
        .emit('message', messageData);
    }

    return messageData;
  }

  async paginate(
    paginationDto: PaginationDto,
    user: any,
    type = 'system',
  ): Promise<Pagination<Message>> {
    const { page, limit, query } = paginationDto;

    const queryBuilder = getRepository(Message)
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.order', 'order')
      .leftJoinAndSelect('order.product', 'product')
      .leftJoinAndSelect('message.from', 'from')
      .leftJoinAndSelect('message.to', 'to');

    if (query) {
      queryBuilder.where(query);
    } else {
      if (type == 'system') {
        queryBuilder.where([
          { order: IsNull(), to: IsNull() },
          { order: IsNull(), to: user.id },
        ]);
        this.redisClient.set(`message:system:${user.id}`, 0);
      } else {
        queryBuilder.where({ order: Not(IsNull()), to: user.id });
        queryBuilder.groupBy('order_id');
        this.redisClient.set(`message:order:${user.id}`, 0);
      }
    }
    queryBuilder.orderBy('message.id', 'DESC');

    return await paginate(queryBuilder, { page, limit });
  }
}
