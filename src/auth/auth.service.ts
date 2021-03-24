import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateLogin(loginName: string, loginPasswd: string) {
    const exists = await this.userService.findByName(loginName);

    if (exists && bcrypt.compareSync(loginPasswd, exists.loginPasswd)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { loginPasswd, ...result } = exists;
      return result;
    }
  }

  jwtSign(payload: any): string {
    return this.jwtService.sign({ ...payload });
  }
}
