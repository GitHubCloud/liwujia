import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { CategoryService } from 'apps/api/src/category/category.service';
import { PaginationDto } from 'apps/api/src/pagination.dto';
import { Brackets, getRepository, Repository } from 'typeorm';
import { CreateStuffDto } from './dto/create-stuff.dto';
import { UpdateStuffDto } from './dto/update-stuff.dto';
import { Stuff } from './entities/stuff.entity';
import { isDate, isDateString } from 'class-validator';
import { StuffColor } from './stuffColor.enum';
import * as _ from 'lodash';
import * as moment from 'moment';
import { EventEmitter2 } from 'eventemitter2';

@Injectable()
export class StuffService {
  constructor(
    @InjectRepository(Stuff)
    private readonly stuffRepo: Repository<Stuff>,
    private readonly categoryService: CategoryService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createStuffDto: CreateStuffDto): Promise<Stuff> {
    const category = await this.categoryService.findOne(
      createStuffDto.category,
    );
    if (_.isEmpty(category)) {
      throw new HttpException(
        { statusCode: HttpStatus.BAD_REQUEST, message: ['类型不存在'] },
        HttpStatus.BAD_REQUEST,
      );
    }

    const detail = _.pick(
      _.get(createStuffDto, 'detail', {}),
      _.map(category.fields, (i) => i.name),
    );
    const message = [];
    _.map(category?.fields, (i) => {
      const val = detail[i.name];

      // require check
      if (i.require && _.isUndefined(val)) {
        message.push(`${i.text}不能为空`);
      }

      // type check
      if (!_.isUndefined(val) && val != '' && i.type) {
        if ((typeof val).toLowerCase() !== String(i.type).toLowerCase()) {
          switch (i.type) {
            case 'boolean':
              detail[i.name] = !!detail[i.name];
              break;
            case 'date':
              if (!isDateString(val) && !isDate(val)) {
                message.push(`${i.text}类型不正确`);
              } else {
                detail[i.name] = moment(detail[i.name]).toDate().getTime();
              }
              break;
            // TODO: abstract
          }
        }
      }
    });

    // 错误汇总返回
    if (!_.isEmpty(message)) {
      throw new HttpException(
        { statusCode: HttpStatus.BAD_REQUEST, message },
        HttpStatus.BAD_REQUEST,
      );
    }

    createStuffDto.detail = detail;
    const stuff = await this.stuffRepo.save(createStuffDto);

    this.eventEmitter.emit('stuff.create', stuff.owner);

    return stuff;
  }

  async paginate(
    paginationDto: PaginationDto,
    color: StuffColor | StuffColor[],
  ): Promise<Pagination<Stuff>> {
    const { page, limit, query } = paginationDto;

    const queryBuilder = getRepository(Stuff)
      .createQueryBuilder('stuff')
      .leftJoinAndSelect('stuff.image', 'image')
      .where(query);

    if (color) {
      const colorArr = Array.isArray(color) ? color : [color];
      queryBuilder.andWhere(
        new Brackets((qb) => {
          colorArr.map((c) => {
            qb.orWhere(
              new Brackets((qb) => {
                this.colorQueryBuilder(c, qb);
              }),
            );
          });
        }),
      );
    }

    queryBuilder.orderBy('stuff.id', 'DESC');
    const pagination = await paginate(queryBuilder, { page, limit });

    return pagination;
  }

  async calendar(date: string, user: any) {
    const startOfMonth = moment(date).startOf('month').toDate().getTime();
    const endOfMonth = moment(date).endOf('month').toDate().getTime();

    const stuffs = await getRepository(Stuff)
      .createQueryBuilder('stuff')
      .leftJoinAndSelect('stuff.image', 'image')
      .where('stuff.owner = :uid', { uid: user.id })
      .andWhere(
        `(
          detail->'$.expirationDate' IS NOT NULL AND
          (
            (detail->'$.expirationDate' > ${startOfMonth} AND detail->'$.expirationDate' < ${endOfMonth}) OR
            (
              detail->'$.expirationDate' - (detail->'$.remainDays' * 86400000) > ${startOfMonth} AND
              detail->'$.expirationDate' - (detail->'$.remainDays' * 86400000) < ${endOfMonth}
            )
          )
        ) OR (
          (detail->'$.openDate' IS NOT NULL AND detail->'$.openLimit' IS NOT NULL) AND
          (
            (
              (UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(detail->'$.openDate' / 1000), INTERVAL detail->'$.openLimit' MONTH)) * 1000) > ${startOfMonth}
              AND
              (UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(detail->'$.openDate' / 1000), INTERVAL detail->'$.openLimit' MONTH)) * 1000) < ${endOfMonth}
            ) OR (
              (UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(detail->'$.openDate' / 1000), INTERVAL detail->'$.openLimit' MONTH)) * 1000) - (detail->'$.remainDays' * 86400000) > ${startOfMonth}
              AND
              (UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(detail->'$.openDate' / 1000), INTERVAL detail->'$.openLimit' MONTH)) * 1000) - (detail->'$.remainDays' * 86400000) < ${endOfMonth}
            )
          )
        )`,
      )
      .getMany();

    const calendar = [];
    for (let day = 1; day <= moment(endOfMonth).daysInMonth(); day++) {
      const weekday = moment(endOfMonth).date(day).weekday();
      calendar.push({ day, weekday, stuffs: [] });
    }

    stuffs.map((item) => {
      const openDate = _.get(item, 'detail.openDate');
      const openLimit = _.get(item, 'detail.openLimit');
      const openExpire = moment(openDate).add(openLimit, 'month');
      let expirationDate = _.get(item, 'detail.expirationDate');
      if (openExpire.isBefore(expirationDate)) {
        expirationDate = openExpire;
      }

      const remainDays = _.get(item, 'detail.remainDays');

      if (moment(expirationDate).isBetween(startOfMonth, endOfMonth)) {
        const expirationDay = moment(expirationDate).date();
        calendar[expirationDay - 1].stuffs.push(item);
      }
      if (
        moment(expirationDate)
          .subtract(remainDays, 'day')
          .isBetween(startOfMonth, endOfMonth)
      ) {
        const expirationDay = moment(expirationDate)
          .subtract(remainDays, 'day')
          .date();
        calendar[expirationDay - 1].stuffs.push(item);
      }
    });

    return calendar;
  }

  async recentExpire(user: any) {
    const stuff = await getRepository(Stuff)
      .createQueryBuilder('stuff')
      .leftJoinAndSelect('stuff.image', 'image')
      .where('stuff.owner = :uid', { uid: user.id })
      .andWhere(`detail->'$.expirationDate' IS NOT NULL`)
      .andWhere(`detail->'$.expirationDate' > ${new Date().getTime()}`)
      .orderBy(`detail->'$.expirationDate'`)
      .getOne();

    return stuff;
  }

  async findOne(id: number): Promise<Stuff> {
    return await this.stuffRepo.findOne(id);
  }

  async update(id: number, updateStuffDto: UpdateStuffDto) {
    const stuff = await this.findOne(id);
    if (_.isEmpty(stuff)) {
      throw new HttpException(
        { statusCode: HttpStatus.BAD_REQUEST, message: ['物品不存在'] },
        HttpStatus.BAD_REQUEST,
      );
    }

    const category = await this.categoryService.findOne(
      updateStuffDto.category,
    );
    if (!updateStuffDto.category || _.isEmpty(category)) {
      throw new HttpException(
        { statusCode: HttpStatus.BAD_REQUEST, message: ['类型不存在'] },
        HttpStatus.BAD_REQUEST,
      );
    }

    const detail = _.pick(
      _.merge(stuff.detail, _.get(updateStuffDto, 'detail', {})),
      _.map(category.fields, (i) => i.name),
    );

    const message = [];
    _.map(category?.fields, (i) => {
      const val = detail[i.name];

      // require check
      if (i.require && _.isUndefined(val)) {
        message.push(`${i.text}不能为空`);
      }

      // type check
      if (!_.isUndefined(val) && val != '' && i.type) {
        if ((typeof val).toLowerCase() !== String(i.type).toLowerCase()) {
          switch (i.type) {
            case 'boolean':
              detail[i.name] = !!detail[i.name];
              break;
            case 'date':
              if (!moment(detail[i.name]).isValid()) {
                message.push(`${i.text}类型不正确`);
              } else {
                detail[i.name] = moment(detail[i.name]).toDate().getTime();
              }
              break;
            // TODO: abstract
          }
        }
      }
    });

    // 错误汇总返回
    if (!_.isEmpty(message)) {
      throw new HttpException(
        { statusCode: HttpStatus.BAD_REQUEST, message },
        HttpStatus.BAD_REQUEST,
      );
    }

    updateStuffDto.detail = detail;
    if (updateStuffDto.isConsumed || updateStuffDto.isWasted) {
      this.eventEmitter.emit('stuff.consume', stuff.owner);
    }

    return await this.stuffRepo.update(id, updateStuffDto);
  }

  async remove(id: number) {
    return await this.stuffRepo.delete(id);
  }

  private colorQueryBuilder(color: StuffColor, qb) {
    switch (color) {
      case StuffColor.红灯: // 红灯过期
        qb.andWhere(`(isConsumed != 1 AND isWasted != 1)`);
        qb.andWhere(
          `(detail->'$.expirationDate' IS NOT NULL OR (detail->'$.openDate' IS NOT NULL AND detail->'$.openLimit' IS NOT NULL))`,
        );
        qb.andWhere(`(
          (detail->'$.expirationDate' < ${new Date().getTime()})
          OR
          (UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(detail->'$.openDate' / 1000), INTERVAL detail->'$.openLimit' MONTH)) * 1000 < ${new Date().getTime()})
        )`);
        break;
      case StuffColor.黄灯: // 黄灯提醒
        qb.andWhere(`(isConsumed != 1 AND isWasted != 1)`);
        qb.andWhere(
          `(detail->'$.expirationDate' IS NOT NULL OR (detail->'$.openDate' IS NOT NULL AND detail->'$.openLimit' IS NOT NULL))`,
        );
        qb.andWhere(`(
          (detail->'$.expirationDate' > ${new Date().getTime()})
          OR
          (UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(detail->'$.openDate' / 1000), INTERVAL detail->'$.openLimit' MONTH)) * 1000 > ${new Date().getTime()})
        )`);
        qb.andWhere(`(
          (detail->'$.expirationDate' - (detail->'$.remainDays' * 86400000) < ${new Date().getTime()})
          OR
          (UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(detail->'$.openDate' / 1000), INTERVAL detail->'$.openLimit' MONTH)) * 1000 - (detail->'$.remainDays' * 86400000) < ${new Date().getTime()})
        )`);
        break;
      case StuffColor.蓝灯: // 蓝灯使用
        qb.andWhere(`(isConsumed = 1 OR isWasted = 1)`);
        break;
      case StuffColor.紫灯: // 紫灯无限
        qb.andWhere(`(isConsumed != 1 AND isWasted != 1)`);
        qb.andWhere(`detail->'$.expirationDate' IS NULL`);
        qb.andWhere(
          `(detail->'$.openDate' IS NULL AND detail->'$.openLimit' IS NULL)`,
        );
        break;
      case StuffColor.绿灯: // 绿灯正常
        qb.andWhere(`(isConsumed != 1 AND isWasted != 1)`);
        qb.andWhere(`(
          detail->'$.expirationDate' IS NOT NULL OR
          (detail->'$.openDate' IS NOT NULL AND detail->'$.openLimit' IS NOT NULL)
        )`);
        qb.andWhere(`(
          detail->'$.expirationDate' IS NOT NULL AND
          (
            detail->'$.expirationDate' > ${new Date().getTime()} AND
            (detail->'$.expirationDate' - (detail->'$.remainDays' * 86400000) > ${new Date().getTime()})
          )
        )`);
        qb.andWhere(`(
          (detail->'$.openDate' IS NULL AND detail->'$.openLimit' IS NULL) OR
          (
            (UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(detail->'$.openDate' / 1000), INTERVAL detail->'$.openLimit' MONTH)) * 1000 > ${new Date().getTime()}) AND
            (UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(detail->'$.openDate' / 1000), INTERVAL detail->'$.openLimit' MONTH)) * 1000 - (detail->'$.remainDays' * 86400000) > ${new Date().getTime()})
          )
        )`);
        break;
    }
  }
}
