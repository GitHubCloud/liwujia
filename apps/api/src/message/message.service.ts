import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getRepository, Repository } from 'typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { PaginationDto } from 'apps/api/src/pagination.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './entities/message.entity';
import { OrderService } from '../order/order.service';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly orderService: OrderService,
    private readonly socketGateway: SocketGateway,
  ) {}

  async create(
    createMessageDto: CreateMessageDto,
    user: any,
  ): Promise<Message> {
    createMessageDto.from = user.id;
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

  async paginate(paginationDto: PaginationDto): Promise<Pagination<Message>> {
    const { page, limit, query } = paginationDto;

    const queryBuilder = getRepository(Message)
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.from', 'from')
      .leftJoinAndSelect('order.to', 'to')
      .where(query)
      .orderBy('order.id', 'DESC');

    return await paginate(queryBuilder, { page, limit });
  }
}
