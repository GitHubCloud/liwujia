import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { getRepository, In, LessThan, Repository } from 'typeorm';
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

    console.log({ createGroupOrderDto });

    return await this.groupOrderRepo.save(createGroupOrderDto);
  }

  async paginate(
    paginationDto: PaginationDto,
    involved: boolean,
    user: any,
  ): Promise<Pagination<GroupOrder>> {
    const { page, limit, query } = paginationDto;

    const queryBuilder = getRepository(GroupOrder)
      .createQueryBuilder('groupOrder')
      .leftJoinAndSelect('groupOrder.images', 'images')
      .leftJoinAndSelect('groupOrder.initiator', 'initiator')
      .leftJoinAndSelect('groupOrder.joiner', 'joiner')
      .where(query);
    if (involved) {
      const involvedIds = await getRepository(GroupOrder)
        .createQueryBuilder('groupOrder')
        .leftJoinAndSelect('groupOrder.joiner', 'joiner')
        .where(`(joiner.id = :userid OR groupOrder.initiator = :userid)`, {
          userid: user.id,
        })
        .groupBy('groupOrder.id')
        .select('groupOrder.id', 'id')
        .execute();

      queryBuilder.andWhereInIds(involvedIds.map((i) => i.id));
    }
    queryBuilder.orderBy('groupOrder.id', 'DESC');

    return paginate(queryBuilder, { page, limit });
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

    // TODO: Event

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
    } else {
      // 到截止时间直接取消
      if (moment(entity.deadline).isBefore()) {
        entity.status = GroupOrderStatus.CANCELED;
      } else {
        let index = -1;
        entity.joiner.map((i, j) => {
          console.log({ i, userEntity });

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

    if (entity.joiner.length !== entity.joinLimit) {
      throw new HttpException('参与人数不足', 400);
    }

    entity.status = GroupOrderStatus.COMPLETE;
    const res = await this.groupOrderRepo.save(entity);

    return res;
  }

  async updateOvertimeStatus() {
    await this.groupOrderRepo.update(
      {
        deadline: LessThan(new Date()),
        status: GroupOrderStatus.INIT,
      },
      {
        status: GroupOrderStatus.CANCELED,
      },
    );
  }
}
