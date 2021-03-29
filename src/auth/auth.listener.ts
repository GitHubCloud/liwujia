import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AuthListener {
  @OnEvent('auth.login')
  handleLogginEvent(payload: User) {
    Logger.log('Event `auth.login` emitted.', JSON.stringify(payload));
  }
}
