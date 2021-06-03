import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { User } from 'apps/api/src/user/entities/user.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageService } from './message.service';

@Injectable()
export class EventListener {
  constructor(private readonly messageService: MessageService) {}
  @OnEvent('user.create')
  handleRegisterEvent(payload: User) {
    Logger.log(`Event 'user.create' emitted, id: '${payload.id}'.`);

    const createMessageDto = new CreateMessageDto();
    createMessageDto.to = payload.id;
    createMessageDto.title = '恭喜你成功注册理物+';
    createMessageDto.content =
      '恭喜你成功注册理物+，适度拥有记录点滴，和理物+一起打开生活密码。';

    this.messageService.create(createMessageDto);
  }
}
