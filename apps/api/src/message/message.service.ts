import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getRepository, IsNull, Not, Repository } from 'typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { PaginationDto } from 'apps/api/src/pagination.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './entities/message.entity';
import { SocketGateway } from '../socket/socket.gateway';
import { RedisService } from 'nestjs-redis';
import { Order } from '../order/entities/order.entity';
import { GroupOrder } from '../group-order/entities/group-order.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(GroupOrder)
    private readonly groupOrderRepo: Repository<GroupOrder>,
    private readonly socketGateway: SocketGateway,
    private readonly redisService: RedisService,
  ) {}

  private redisClient = this.redisService.getClient();

  async create(
    createMessageDto: CreateMessageDto,
    user?: any,
  ): Promise<Message> {
    createMessageDto.from = user ? user.id : null;

    if (createMessageDto.order) {
      // 订单下的沟通
      const order = await this.orderRepo.findOne(createMessageDto.order);
      if (!order) {
        throw new HttpException('订单不存在', 400);
      }
      if (!createMessageDto.to && !user) {
        throw new HttpException('参数不正确', 400);
      }

      if (!createMessageDto.to) {
        if (order.seller.id === user.id) {
          createMessageDto.to = order.buyer.id;
        } else {
          createMessageDto.to = order.seller.id;
        }
      }

      this.redisClient.incr(`message:order:${createMessageDto.to}`);
    } else if (createMessageDto.groupOrder) {
      // 团购下的沟通
      const groupOrder = await this.groupOrderRepo.findOne(
        createMessageDto.groupOrder,
      );
      if (!groupOrder) {
        throw new HttpException('团购不存在', 400);
      }
      if (!createMessageDto.to && !user) {
        throw new HttpException('参数不正确', 400);
      }

      if (createMessageDto.to) {
        this.redisClient.incr(`message:groupOrder:${createMessageDto.to}`);
      } else {
        // send message to all user from the group and filter the sender
        let receivers = [groupOrder.initiator.id];
        receivers = receivers.concat(groupOrder.joiner.map((i) => i.id));
        receivers = receivers.filter((i) => i != createMessageDto.from);
        receivers.map((i) => {
          this.redisClient.incr(`message:groupOrder:${i}`);
        });
      }
    } else {
      this.redisClient.incr(`message:system:${createMessageDto.to}`);
    }

    let messageData = await this.messageRepo.save(
      this.messageRepo.create(createMessageDto),
    );
    messageData = await this.messageRepo.findOne(messageData.id);

    if (createMessageDto.order && user) {
      this.socketGateway.server
        .to(`order:${createMessageDto.order}`)
        .emit('message', messageData);
    }
    if (createMessageDto.groupOrder && user) {
      this.socketGateway.server
        .to(`groupOrder:${createMessageDto.groupOrder}`)
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
      .leftJoinAndSelect('order.buyer', 'buyer')
      .leftJoinAndSelect('order.seller', 'seller')
      .leftJoinAndSelect('message.groupOrder', 'groupOrder')
      .leftJoinAndSelect('groupOrder.initiator', 'initiator')
      .leftJoinAndSelect('message.from', 'from')
      .leftJoinAndSelect('message.to', 'to');

    if (query) {
      queryBuilder.where(query);
    } else {
      if (type == 'system') {
        queryBuilder.where([
          { order: IsNull(), groupOrder: IsNull(), to: IsNull() },
          { order: IsNull(), groupOrder: IsNull(), to: user.id },
        ]);
        this.redisClient.set(`message:system:${user.id}`, 0);
      } else if (type == 'order') {
        const lastMessage = await getRepository(Message)
          .createQueryBuilder('message')
          .select('MAX(message.id)', 'mid')
          .where({ order: Not(IsNull()), to: user.id })
          .groupBy('message.order')
          .getRawAndEntities();
        queryBuilder.andWhereInIds(lastMessage.raw.map((i) => i.mid));
        this.redisClient.set(`message:order:${user.id}`, 0);
      } else if (type == 'groupOrder') {
        const lastMessage = await getRepository(Message)
          .createQueryBuilder('message')
          .leftJoinAndSelect('message.groupOrder', 'groupOrder')
          .leftJoinAndSelect('groupOrder.joiner', 'joiner')
          .select('MAX(message.id)', 'mid')
          .where({ groupOrder: Not(IsNull()) })
          .andWhere(
            `(
              (message.to IS NOT NULL AND message.to = :userid) OR 
              (message.to IS NULL AND (joiner.id = :userid OR groupOrder.initiator = :userid))
            )`,
            { userid: user.id },
          )
          .groupBy('message.groupOrder')
          .getRawAndEntities();
        queryBuilder.andWhereInIds(lastMessage.raw.map((i) => i.mid));
        this.redisClient.set(`message:groupOrder:${user.id}`, 0);
      }
    }
    queryBuilder.orderBy('message.id', 'DESC');

    return await paginate(queryBuilder, { page, limit });
  }
}
