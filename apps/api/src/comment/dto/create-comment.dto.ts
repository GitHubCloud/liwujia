import { ApiHideProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';
import { IsExistsInTable } from '../../custom.decorator';
import { Resource } from '../../resource/entities/resource.entity';
import { User } from '../../user/entities/user.entity';

export class CreateCommentDto {
  @ValidateIf((o) => !o.image) // 有图片无须内容
  @IsNotEmpty({ message: '内容不能为空' })
  content?: string;

  @IsOptional()
  @IsExistsInTable('resource', 'id', { message: '图片不存在' })
  image?: Resource;

  @IsOptional()
  @ApiHideProperty()
  article?: number;

  @IsOptional()
  @ApiHideProperty()
  product?: number;

  @IsOptional()
  @ApiHideProperty()
  groupOrder?: number;

  @ApiHideProperty()
  replyTo: number;

  @ApiHideProperty()
  author: User;
}
