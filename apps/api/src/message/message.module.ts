import { Global, Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { OrderModule } from '../order/order.module';
import { SocketModule } from '../socket/socket.module';
import { EventListener } from './event.listener';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Message]), OrderModule, SocketModule],
  controllers: [MessageController],
  providers: [MessageService, EventListener],
  exports: [MessageService, EventListener],
})
export class MessageModule {}
