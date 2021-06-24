import { ApiHideProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @ApiHideProperty()
  from?: number;

  @ApiHideProperty()
  to?: number;

  @IsOptional()
  order?: number;

  @IsOptional()
  title?: string;

  @IsNotEmpty({ message: '消息内容不能为空' })
  content: string;

  @IsOptional()
  remark?: any;
}
