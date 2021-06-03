import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from 'eventemitter2';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const userData = await this.userRepo.save(
      this.userRepo.create(createUserDto),
    );
    this.eventEmitter.emit('user.create', userData);

    return userData;
  }

  async findOne(id: number): Promise<User> {
    return await this.userRepo.findOne(id);
  }

  async findByName(loginName: string): Promise<User> {
    return await this.userRepo.findOne({
      nickname: loginName,
    });
  }

  async findByOpenID(openid: string): Promise<User> {
    return await this.userRepo.findOne({
      wechatOpenID: openid,
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return await this.userRepo.update(id, updateUserDto);
  }
}
