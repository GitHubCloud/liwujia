import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EventEmitter2 } from 'eventemitter2';
import { UserService } from 'apps/api/src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async validateLogin(loginName: string, loginPasswd: string) {
    const exists = await this.userService.findByName(loginName);

    if (
      exists &&
      exists.loginPasswd &&
      bcrypt.compareSync(loginPasswd, exists.loginPasswd)
    ) {
      this.eventEmitter.emit('auth.login', exists);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { loginPasswd, ...result } = exists;
      return result;
    }
  }

  jwtSign(payload: any): string {
    return this.jwtService.sign({ ...payload });
  }
}
