import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async validateUser(loginName: string, loginPasswd: string) {
    const exists = await this.userService.findByName(loginName);

    if (exists && bcrypt.compareSync(loginPasswd, exists.loginPasswd)) {
      return exists;
    }
  }
}
