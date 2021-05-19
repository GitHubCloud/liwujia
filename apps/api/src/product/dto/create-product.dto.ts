import { ApiHideProperty } from '@nestjs/swagger';
import { IsNotEmpty, Max, Min } from 'class-validator';
import { IsExistsInTable } from '../../custom.decorator';
import { Resource } from '../../resource/entities/resource.entity';

export class CreateProductDto {
  @IsNotEmpty({ message: '内容不能为空' })
  content: string;

  @IsExistsInTable('resource', 'id', { message: '图片不存在', each: true })
  images?: Resource[];

  @IsNotEmpty({ message: '纬度不能为空' })
  latitude: string;

  @IsNotEmpty({ message: '经度不能为空' })
  longitude: string;

  @IsNotEmpty({ message: '地理位置不能为空' })
  position: string;

  @IsNotEmpty({ message: '价格不能为空' })
  @Min(0, { message: '价格区间在 0 - 999999' })
  @Max(999999, { message: '价格区间在 0 - 999999' })
  price: number;

  @IsNotEmpty({ message: '类型不能为空' })
  category: string;

  @IsNotEmpty({ message: '品牌不能为空' })
  brand: string;

  @IsNotEmpty({ message: '成色不能为空' })
  quality: string;

  @ApiHideProperty()
  owner: number;
}
