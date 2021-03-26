import { ApiHideProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty({ message: '内容不能为空' })
  content: string;

  @ApiHideProperty()
  article: number;

  @ApiHideProperty()
  replyTo: number;

  @ApiHideProperty()
  author: number;
}
