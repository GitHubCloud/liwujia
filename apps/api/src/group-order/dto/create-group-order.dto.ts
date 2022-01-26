import { ApiHideProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, Max, Min } from 'class-validator';
import {
  DateCompare,
  IsDateLike,
  IsExistsInTable,
} from '../../custom.decorator';
import { Resource } from '../../resource/entities/resource.entity';
import { User } from '../../user/entities/user.entity';

export class CreateGroupOrderDto {
  @IsNotEmpty({ message: '标题不能为空' })
  title: string;

  @IsNotEmpty({ message: '描述不能为空' })
  describe: string;

  @IsNotEmpty({ message: '纬度不能为空' })
  latitude: number;

  @IsNotEmpty({ message: '经度不能为空' })
  longitude: number;

  @IsNotEmpty({ message: '地理位置不能为空' })
  position: string;

  @Min(0, { message: '价格区间在 0 - 999999' })
  @Max(999999, { message: '价格区间在 0 - 999999' })
  price: number;

  @Min(1, { message: '参与人数不能小于 1 人' })
  @Max(100, { message: '参与人数不能大于 100 人' })
  joinLimit: number;

  @IsDateLike({ message: '截止时间不正确' })
  @DateCompare('after', null, { message: '截止时间必须大于当前时间' })
  deadline: Date;

  @IsOptional()
  @IsExistsInTable('resource', 'id', { message: '图片不存在', each: true })
  images?: Resource[];

  @IsOptional()
  @IsExistsInTable('resource', 'id', { message: '图片不存在' })
  qrcode?: Resource;

  @ApiHideProperty()
  initiator: User;
}
