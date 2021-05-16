import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { CategoryService } from 'apps/api/src/category/category.service';
import { PaginationDto } from 'apps/api/src/pagination.dto';
import { getRepository, Repository } from 'typeorm';
import { CreateStuffDto } from './dto/create-stuff.dto';
import { UpdateStuffDto } from './dto/update-stuff.dto';
import { Stuff } from './entities/stuff.entity';
import { isDate, isDateString } from 'class-validator';
import { StuffColor } from './stuffColor.enum';
import * as _ from 'lodash';
import * as moment from 'moment';

@Injectable()
export class StuffService {
  constructor(
    @InjectRepository(Stuff)
    private readonly stuffRepo: Repository<Stuff>,
    private readonly categoryService: CategoryService,
  ) { }

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
      if (i.type) {
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
    return await this.stuffRepo.save(createStuffDto);
  }

  async paginate(paginationDto: PaginationDto, color: StuffColor): Promise<Pagination<Stuff>> {
    const { page, limit, query } = paginationDto;

    const queryBuilder = getRepository(Stuff)
      .createQueryBuilder('stuff')
      .leftJoinAndSelect('stuff.image', 'image')
      .where(query);

    switch (color) {
      case StuffColor.红灯: // 红灯过期
        queryBuilder.andWhere(`detail->'$.expirationDate' IS NOT NULL`);
        queryBuilder.andWhere(`detail->'$.expirationDate' < ${new Date().getTime()}`);
        break;
      case StuffColor.黄灯: // 黄灯提醒
        queryBuilder.andWhere(`detail->'$.expirationDate' IS NOT NULL`);
        queryBuilder.andWhere(`detail->'$.expirationDate' > ${new Date().getTime()}`);
        queryBuilder.andWhere(`detail->'$.expirationDate' - (detail->'$.remainDays' * 86400000) < ${new Date().getTime()}`);
        break;
      case StuffColor.蓝灯: // 蓝灯使用
        break;
      case StuffColor.紫灯: // 紫灯无限
        queryBuilder.andWhere(`detail->'$.expirationDate' IS NULL`);
        break;
      case StuffColor.绿灯: // 绿灯正常
        queryBuilder.andWhere(`detail->'$.expirationDate' IS NOT NULL`);
        queryBuilder.andWhere(`detail->'$.expirationDate' > ${new Date().getTime()}`);
        queryBuilder.andWhere(`detail->'$.expirationDate' - (detail->'$.remainDays' * 86400000) > ${new Date().getTime()}`);
        break;
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
      .andWhere(`(
        detail->'$.expirationDate' IS NOT NULL AND
        (
          (detail->'$.expirationDate' > ${startOfMonth} AND detail->'$.expirationDate' < ${endOfMonth}) OR
          (
            detail->'$.expirationDate' - (detail->'$.remainDays' * 86400000) > ${startOfMonth} AND
            detail->'$.expirationDate' - (detail->'$.remainDays' * 86400000) < ${endOfMonth}
          )
        )
      )`)
      .getMany();

    const calendar = [];
    for (let day = 1; day <= moment(endOfMonth).daysInMonth(); day++) {
      calendar.push({ day, stuffs: [] });
    }

    stuffs.map(item => {
      const expirationDate = _.get(item, 'detail.expirationDate');
      const remainDays = _.get(item, 'detail.remainDays');

      if (moment(expirationDate).isBetween(startOfMonth, endOfMonth)) {
        const expirationDay = moment(expirationDate).date();
        calendar[expirationDay - 1].stuffs.push(item);
      }
      if(moment(expirationDate).subtract(remainDays, 'day').isBetween(startOfMonth, endOfMonth)){
        const expirationDay = moment(expirationDate).subtract(remainDays, 'day').date();
        calendar[expirationDay - 1].stuffs.push(item);
      }
    });

    return calendar;
  }

  async findOne(id: number): Promise<Stuff> {
    return await this.stuffRepo.findOne(id);
  }

  async update(id: number, updateStuffDto: UpdateStuffDto) {
    return await this.stuffRepo.update(id, updateStuffDto);
  }

  async remove(id: number) {
    return await this.stuffRepo.delete(id);
  }
}
