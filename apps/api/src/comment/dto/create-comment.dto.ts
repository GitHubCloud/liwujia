import { ApiHideProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty({ message: '内容不能为空' })
  content: string;

  @IsOptional()
  @ApiHideProperty()
  article?: number;

  @IsOptional()
  @ApiHideProperty()
  product?: number;

  @ApiHideProperty()
  replyTo: number;

  @ApiHideProperty()
  author: number;
}
