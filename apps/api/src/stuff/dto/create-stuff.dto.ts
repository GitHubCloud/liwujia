import { ApiHideProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
// import { IsExistsInTable } from 'apps/api/src/custom.decorator';

export class CreateStuffDto {
  @IsNotEmpty({ message: '名称不能为空' })
  name: string;

  // @IsExistsInTable('category')
  @IsNotEmpty({ message: '类型不能为空' })
  category: number;

  @IsOptional()
  detail: any;

  @ApiHideProperty()
  owner: number;
}
