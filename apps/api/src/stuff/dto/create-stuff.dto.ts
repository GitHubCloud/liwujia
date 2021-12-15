import { ApiHideProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';
import { Category } from '../../category/entities/category.entity';
import { IsExistsInTable } from '../../custom.decorator';
import { Resource } from '../../resource/entities/resource.entity';

export class CreateStuffDto {
  @IsNotEmpty({ message: '名称不能为空' })
  name: string;

  @IsOptional()
  @IsExistsInTable('resource', 'id', { message: '图片不存在' })
  image?: Resource;

  @IsNotEmpty({ message: '类型不能为空' })
  @IsExistsInTable('category', 'id', { message: '类型不存在' })
  category: Category;

  @IsOptional()
  detail: any;

  @ApiHideProperty()
  owner: number;

  @IsOptional()
  @IsBoolean({ message: '不是布尔类型' })
  isConsumed: boolean;

  @IsOptional()
  @IsBoolean({ message: '不是布尔类型' })
  isWasted: boolean;
}
