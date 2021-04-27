import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiBody({
    schema: { example: { loginName: 'string', loginPasswd: 'string' } },
  })
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Req() req) {
    return this.authService.jwtSign(req.user);
  }

  @ApiBody({
    schema: { example: { code: 'string' } },
    description:
      '微信小程序登录流程：https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html',
  })
  @UseGuards(AuthGuard('miniProgram'))
  @Post('miniProgram')
  async miniProgram(@Req() req) {
    return this.authService.jwtSign(req.user);
  }
}
