import { ApiHideProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ArticleTypes } from '../articleType.enum';

export class CreateArticleDto {
  @IsNotEmpty({ message: '标题不能为空' })
  title: string;

  @IsOptional()
  @IsEnum(ArticleTypes, { message: '类型不在可选范围' })
  type?: ArticleTypes;

  @IsOptional()
  tags?: string;

  @IsNotEmpty({ message: '内容不能为空' })
  content: string;

  @ApiHideProperty()
  author: number;
}
