import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from 'eventemitter2';
import * as moment from 'moment';
import { paginateRawAndEntities, Pagination } from 'nestjs-typeorm-paginate';
import { getRepository, LessThan, Repository } from 'typeorm';
import { PaginationDto } from '../pagination.dto';
import { Resource } from '../resource/entities/resource.entity';
import { User } from '../user/entities/user.entity';
import { CreateGroupOrderDto } from './dto/create-group-order.dto';
import { UpdateGroupOrderDto } from './dto/update-group-order.dto';
import { GroupOrder, GroupOrderStatus } from './entities/group-order.entity';

@Injectable()
export class GroupOrderService {
  constructor(
    @InjectRepository(GroupOrder)
    private readonly groupOrderRepo: Repository<GroupOrder>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Resource)
    private readonly resourceRepo: Repository<Resource>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createGroupOrderDto: CreateGroupOrderDto): Promise<GroupOrder> {
    createGroupOrderDto.initiator = await this.userRepo.findOne(
      createGroupOrderDto.initiator,
    );
    if (createGroupOrderDto.images) {
      const images = await this.resourceRepo.findByIds(
        createGroupOrderDto.images,
      );
      createGroupOrderDto.images = images;
    }

    const entity = await this.groupOrderRepo.save(createGroupOrderDto);
    this.eventEmitter.emit('group.create', entity.initiator);

    return entity;
  }

  async paginate(
    paginationDto: PaginationDto,
    involved: boolean,
    user: any,
  ): Promise<Pagination<GroupOrder>> {
    const {
      page,
      limit,
      query,
      nearest,
      longitude,
      latitude,
      distance,
    } = paginationDto;

    const queryBuilder = getRepository(GroupOrder)
      .createQueryBuilder('groupOrder')
      .leftJoinAndSelect('groupOrder.images', 'images')
      .leftJoinAndSelect('groupOrder.initiator', 'initiator')
      .leftJoinAndSelect('groupOrder.joiner', 'joiner')
      .where(query);

    if (involved) {
      // 剔除用户没有参与的拼团
      const involvedIds = await getRepository(GroupOrder)
        .createQueryBuilder('groupOrder')
        .leftJoinAndSelect('groupOrder.joiner', 'joiner')
        .where(`(joiner.id = :userid OR groupOrder.initiator = :userid)`, {
          userid: user.id,
        })
        .groupBy('groupOrder.id')
        .select('groupOrder.id', 'id')
        .execute();

      // 满员拼团优先展示
      /* const fullgroupIds = await getRepository(GroupOrder)
        .createQueryBuilder('groupOrder')
        .leftJoinAndSelect('groupOrder.joiner', 'joiner')
        .where(`(status = :status)`, {
          status: GroupOrderStatus.INIT,
        })
        .groupBy('groupOrder.id')
        .select('groupOrder.id', 'id')
        .addSelect('groupOrder.joinLimit')
        .addSelect('COUNT(joiner.id)', 'joinerLength')
        .having('joinerLength = groupOrder.joinLimit')
        .execute(); */

      queryBuilder
        .andWhereInIds(involvedIds.map((i) => i.id))
        // .orderBy(`groupOrder.id IN (${fullgroupIds.map((i) => i.id)})`, 'DESC')
        .addOrderBy('groupOrder.id', 'DESC');
    } else {
      // 剔除满员拼团
      const unfullgroupIds = await getRepository(GroupOrder)
        .createQueryBuilder('groupOrder')
        .leftJoinAndSelect('groupOrder.joiner', 'joiner')
        .where(`(status = :status)`, {
          status: GroupOrderStatus.INIT,
        })
        .groupBy('groupOrder.id')
        .select('groupOrder.id', 'id')
        .addSelect('groupOrder.joinLimit')
        .addSelect('COUNT(joiner.id)', 'joinerLength')
        .having('joinerLength != groupOrder.joinLimit')
        .execute();

      queryBuilder.andWhereInIds(unfullgroupIds.map((i) => i.id));
      if (longitude && latitude) {
        queryBuilder.addSelect(
          `(
          6380 * acos (
            cos ( radians(${latitude}) )
            * cos( radians(groupOrder.latitude) )
            * cos( radians(groupOrder.longitude) - radians(${longitude}) )
            + sin( radians(${latitude}) )
            * sin( radians(groupOrder.latitude) )
          )
        )`,
          'distance',
        );
        if (distance) {
          queryBuilder.andWhere(`(
            6380 * acos (
              cos ( radians(${latitude}) )
              * cos( radians(groupOrder.latitude) )
              * cos( radians(groupOrder.longitude) - radians(${longitude}) )
              + sin( radians(${latitude}) )
              * sin( radians(groupOrder.latitude) )
            )
          ) < ${distance}`);
        }
        if (nearest) {
          queryBuilder.addOrderBy(`distance`, 'ASC');
        }
      }
      queryBuilder.addOrderBy('groupOrder.id', 'DESC');
    }

    const [pagination, raw] = await paginateRawAndEntities(queryBuilder, {
      page,
      limit,
    });

    for (const i in pagination.items) {
      pagination.items[i].distance = raw[i].distance;
    }

    return pagination;
  }

  async findOne(condition: any): Promise<GroupOrder> {
    return this.groupOrderRepo.findOne(condition);
  }

  update(id: number, updateGroupOrderDto: UpdateGroupOrderDto) {
    return `This action updates a #${id} groupOrder`;
  }

  remove(id: number) {
    return `This action removes a #${id} groupOrder`;
  }

  async join(id: number, user: any) {
    const entity = await this.groupOrderRepo.findOne(id);
    const userEntity = await this.userRepo.findOne(user.id);
    if (!entity || !userEntity) {
      throw new HttpException('实例不存在', 400);
    }

    if (moment(entity.deadline).isBefore()) {
      throw new HttpException('该拼团已过截止时间', 400);
    }
    if (entity.joiner.length >= entity.joinLimit) {
      throw new HttpException('该拼团已达到限制人数', 400);
    }
    if (entity.initiator.id === userEntity.id) {
      throw new HttpException('不能参与自己发起的拼团', 400);
    }
    entity.joiner.map((i) => {
      if (i.id === userEntity.id) {
        throw new HttpException('您已经加入了该团', 400);
      }
    });

    entity.joiner.push(userEntity);
    const res = await this.groupOrderRepo.save(entity);

    this.eventEmitter.emit('groupOrder.join', entity);
    if (entity.joiner.length >= entity.joinLimit) {
      this.eventEmitter.emit('groupOrder.full', entity);
    }

    return res;
  }

  async cancel(id: number, user: any) {
    const entity = await this.groupOrderRepo.findOne(id);
    const userEntity = await this.userRepo.findOne(user.id);
    if (!entity || !userEntity) {
      throw new HttpException('实例不存在', 400);
    }

    if (entity.status !== GroupOrderStatus.INIT) {
      throw new HttpException('该拼团已结束', 400);
    }

    let res;
    if (entity.initiator.id === userEntity.id) {
      entity.status = GroupOrderStatus.CANCELED;
      res = await this.groupOrderRepo.save(entity);
      this.eventEmitter.emit('groupOrder.initiatorCancel', entity);
    } else {
      // 到截止时间直接取消
      if (moment(entity.deadline).isBefore()) {
        entity.status = GroupOrderStatus.CANCELED;
        this.eventEmitter.emit('groupOrder.joinerCancel', entity);
      } else {
        let index = -1;
        entity.joiner.map((i, j) => {
          if (i.id === userEntity.id) {
            index = j;
          }
        });

        if (index < 0) {
          throw new HttpException('您没有加入该拼团', 400);
        }

        entity.joiner = [
          ...entity.joiner.slice(0, index),
          ...entity.joiner.slice(index + 1, entity.joiner.length),
        ];
        this.eventEmitter.emit('groupOrder.leave', entity);
      }
      res = await this.groupOrderRepo.save(entity);
    }

    return res;
  }

  async start(id: number, user: any) {
    const entity = await this.groupOrderRepo.findOne(id);
    const userEntity = await this.userRepo.findOne(user.id);
    if (!entity || !userEntity) {
      throw new HttpException('实例不存在', 400);
    }

    if (entity.initiator.id !== userEntity.id) {
      throw new HttpException('非团长不能完成拼团', 400);
    }

    /* if (entity.joiner.length !== entity.joinLimit) {
      throw new HttpException('参与人数不足', 400);
    } */

    entity.status = GroupOrderStatus.COMPLETE;
    const savedEntity = await this.groupOrderRepo.save(entity);
    this.eventEmitter.emit('group.complete', savedEntity);

    return savedEntity;
  }

  async updateOvertimeStatus() {
    const fullgroups = await getRepository(GroupOrder)
      .createQueryBuilder('groupOrder')
      .leftJoinAndSelect('groupOrder.joiner', 'joiner')
      .leftJoinAndSelect('groupOrder.initiator', 'initiator')
      .where({
        deadline: LessThan(new Date()),
        status: GroupOrderStatus.INIT,
      })
      .groupBy('groupOrder.id')
      .addSelect('COUNT(joiner.id)', 'joinerLength')
      .having('joinerLength != groupOrder.joinLimit')
      .getMany();

    if (fullgroups && fullgroups.length) {
      fullgroups.map((i) => this.eventEmitter.emit('groupOrder.autoCancel', i));
      await this.groupOrderRepo.update(
        fullgroups.map((i) => i.id),
        { status: GroupOrderStatus.CANCELED },
      );
    }
  }
}
