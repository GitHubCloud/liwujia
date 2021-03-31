import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { CategoryService } from 'src/category/category.service';
import { PaginationDto } from 'src/pagination.dto';
import { Repository } from 'typeorm';
import { CreateStuffDto } from './dto/create-stuff.dto';
import { UpdateStuffDto } from './dto/update-stuff.dto';
import { Stuff } from './entities/stuff.entity';
import * as _ from 'lodash';
import { isDate, isDateString } from 'class-validator';

@Injectable()
export class StuffService {
  constructor(
    @InjectRepository(Stuff)
    private readonly stuffRepo: Repository<Stuff>,
    private readonly categoryService: CategoryService,
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
      if (i.type) {
        if ((typeof val).toLowerCase() !== String(i.type).toLowerCase()) {
          switch (i.type) {
            case 'boolean':
              detail[i.name] = !!detail[i.name];
              break;
            case 'date':
              if (!isDateString(val) && !isDate(val)) {
                message.push(`${i.text}类型不正确`);
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

  async paginate(paginationDto: PaginationDto): Promise<Pagination<Stuff>> {
    const { page, limit } = paginationDto;
    return await paginate(this.stuffRepo, { page, limit });
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
