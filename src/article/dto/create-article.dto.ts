import { ApiHideProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateArticleDto {
  @IsNotEmpty({ message: '标题不能为空' })
  title: string;

  @IsOptional()
  tags?: string;

  @IsNotEmpty({ message: '内容不能为空' })
  content: string;

  @ApiHideProperty()
  author: number;
}
