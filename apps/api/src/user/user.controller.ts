import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Put,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('User')
@Controller('user')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /* 仅通过小程序创建用户 */
  /* @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.create(createUserDto);
  } */

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<User> {
    return this.userService.findOne(id);
  }

  @Put()
  async update(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(req.user.id, updateUserDto);
  }

  @Put(':id/follow')
  async follow(@Req() req, @Param('id') to: number) {
    return this.userService.toggleFollow(req.user.id, to);
  }

  @Get(':id/profile')
  async profile(@Param('id') id: number, @Req() req): Promise<User> {
    return this.userService.profile(id, req.user.id);
  }

  @Get(':id/followers')
  async followers(@Param('id') id: number, @Req() req): Promise<User[]> {
    return this.userService.followers(id, req.user.id);
  }

  @Get(':id/following')
  async following(@Param('id') id: number, @Req() req): Promise<User[]> {
    return this.userService.following(id, req.user.id);
  }
}
