import { Global, Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { SocketModule } from '../socket/socket.module';
import { EventListener } from './event.listener';
import { Order } from '../order/entities/order.entity';
import { CommonModule } from '../common/common.module';
import { GroupOrder } from '../group-order/entities/group-order.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Order, GroupOrder]),
    SocketModule,
    CommonModule,
  ],
  controllers: [MessageController],
  providers: [MessageService, EventListener],
  exports: [MessageService, EventListener],
})
export class MessageModule {}
