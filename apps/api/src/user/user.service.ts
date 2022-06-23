import { HttpException, Injectable } from '@nestjs/common';
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

  async findOne(id: number, uid?: number): Promise<User> {
    const user = await getRepository(User)
      .createQueryBuilder('user')
      .leftJoin('user.points', 'points')
      .addSelect('SUM(points.amount)', 'points')
      .where('user.id = :userid', { userid: id })
      .getRawAndEntities();

    _.first(user.entities).points = _.first(user.raw).points || 0;

    const { followers, following } = await this.getFollowCount(id);
    _.first(user.entities).followers = followers;
    _.first(user.entities).following = following;
    _.first(user.entities).isFollowed = uid
      ? await this.checkIsFollowed(uid, id)
      : false;

    return _.first(user.entities);
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

  async updateByUnionID(unionid: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.biography) {
      await this.commonService.WechatMessageSecurityCheck(sceneEnum.资料, {
        content: updateUserDto.biography,
        signature: updateUserDto.biography,
      });
    }

    return await this.userRepo.update({ unionid }, updateUserDto);
  }

  async updateByOfficialOpenID(openid: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.biography) {
      await this.commonService.WechatMessageSecurityCheck(sceneEnum.资料, {
        content: updateUserDto.biography,
        signature: updateUserDto.biography,
      });
    }

    return await this.userRepo.update(
      { officialOpenID: openid },
      updateUserDto,
    );
  }

  private async getFollowCount(id: number) {
    const followersCounts = _.first(
      await this.userRepo.query(
        `SELECT
            COUNT(followers.to) as followers
          FROM
            user AS u
            LEFT JOIN follower followers ON u.id = followers.to
          WHERE u.id = ?`,
        [id],
      ),
    );
    const followingCounts = _.first(
      await this.userRepo.query(
        `SELECT
            COUNT(following.to) as following
          FROM
            user AS u
            LEFT JOIN follower following ON u.id = following.from
          WHERE u.id = ?`,
        [id],
      ),
    );

    return {
      followers: (<any>followersCounts).followers,
      following: (<any>followingCounts).following,
    };
  }

  private async checkIsFollowed(from: number, to: number): Promise<boolean> {
    const exists = await getRepository(User)
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.followers', 'followers')
      .where('user.id = :to', { to })
      .andWhere('followers.id = :from', { from })
      .getCount();

    return !!exists;
  }

  async toggleFollow(from: number, to: number) {
    if (from == to) throw new HttpException('不能关注自己', 400);

    const isFollowed = await this.checkIsFollowed(from, to);
    const qb = getRepository(User)
      .createQueryBuilder('user')
      .relation('followers')
      .of(to);
    if (isFollowed) {
      await qb.remove(from);
    } else {
      await qb.add(from);
    }
  }

  async profile(id: number, uid: number): Promise<User> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .where({ id })
      .getOne();

    const { followers, following } = await this.getFollowCount(id);
    user.followers = followers;
    user.following = following;
    user.isFollowed = await this.checkIsFollowed(uid, id);

    return user;
  }

  async followers(id: number, uid: number): Promise<User[]> {
    const followersIds = await this.userRepo.query(
      `SELECT
        followers.from
      FROM
        user AS u
        LEFT JOIN follower followers ON u.id = followers.to
      WHERE u.id = ?`,
      [id],
    );

    const users = [];
    for await (const { from } of followersIds) {
      users.push(await this.profile(from, uid));
    }

    return users;
  }

  async following(id: number, uid: number): Promise<User[]> {
    const followingIds = await this.userRepo.query(
      `SELECT
        following.to
      FROM
        user AS u
        LEFT JOIN follower following ON u.id = following.from
      WHERE u.id = ?`,
      [id],
    );

    const users = [];
    for await (const { to } of followingIds) {
      users.push(await this.profile(to, uid));
    }

    return users;
  }
}
