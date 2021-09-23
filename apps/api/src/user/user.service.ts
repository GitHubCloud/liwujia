import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from 'eventemitter2';
import { getRepository, Repository } from 'typeorm';
import { CommonService, sceneEnum } from '../common/common.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as _ from 'lodash';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
    private readonly commonService: CommonService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const userData = await this.userRepo.save(
      this.userRepo.create(createUserDto),
    );
    this.eventEmitter.emit('user.create', userData);

    return userData;
  }

  async findOne(id: number): Promise<User> {
    const points = await getRepository(User)
      .createQueryBuilder('user')
      .leftJoin('user.points', 'points')
      .addSelect('SUM(points.amount)', 'points')
      .where('user.id = :userid', { userid: id })
      .getRawAndEntities();

    _.first(points.entities).points = _.first(points.raw).points || 0;

    return _.first(points.entities);
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
    if (updateUserDto.biography) {
      await this.commonService.WechatMessageSecurityCheck(sceneEnum.资料, {
        content: updateUserDto.biography,
        signature: updateUserDto.biography,
      });
    }

    return await this.userRepo.update(id, updateUserDto);
  }
}
