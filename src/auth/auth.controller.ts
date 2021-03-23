import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiBody({
    schema: { example: { loginName: '', loginPasswd: '' } },
  })
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Req() req) {
    return req.user;
  }
}
