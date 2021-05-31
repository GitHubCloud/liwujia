import { ApiHideProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @ApiHideProperty()
  from: number;

  @ApiHideProperty()
  to: number;

  @IsOptional()
  order: number;

  @IsNotEmpty({ message: '消息内容不能为空' })
  content: string;
}
