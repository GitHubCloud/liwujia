import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'loginName',
      passwordField: 'loginPasswd',
    });
  }

  async validate(loginName: string, loginPasswd: string): Promise<any> {
    const user = await this.authService.validateLogin(loginName, loginPasswd);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
