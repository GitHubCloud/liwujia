import { ApiHideProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';
import { IsExistsInTable } from '../../custom.decorator';
import { Resource } from '../../resource/entities/resource.entity';
import { ArticleTypes } from '../articleType.enum';

export class CreateArticleDto {
  @IsNotEmpty({ message: '标题不能为空' })
  title: string;

  @IsEnum(ArticleTypes, { message: '类型不在可选范围' })
  type: ArticleTypes = ArticleTypes.交流;

  @IsOptional()
  @IsExistsInTable('resource', 'id', { message: '图片不存在', each: true })
  images?: Resource[];

  @IsOptional()
  tags?: string;

  @IsOptional()
  latitude?: string;

  @IsOptional()
  longitude?: string;

  @IsOptional()
  position?: string;

  @ValidateIf((o) => o.type !== ArticleTypes.交流) // 交流无需内容
  @IsNotEmpty({ message: '内容不能为空' })
  content: string;

  @ApiHideProperty()
  author: number;
}
