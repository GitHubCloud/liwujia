import { ApiHideProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';
import { ArticleTypes } from '../articleType.enum';

export class CreateArticleDto {
  @IsNotEmpty({ message: '标题不能为空' })
  title: string;

  @IsOptional()
  @IsEnum(ArticleTypes, { message: '类型不在可选范围' })
  type?: ArticleTypes;

  @IsOptional()
  tags?: string;

  @ValidateIf((o) => o.type !== ArticleTypes.交流) // 交流无需内容
  @IsNotEmpty({ message: '内容不能为空' })
  content: string;

  @ApiHideProperty()
  author: number;
}
