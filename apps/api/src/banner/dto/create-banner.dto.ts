import { IsBoolean, IsOptional, IsUrl } from 'class-validator';
import { IsExistsInTable } from '../../custom.decorator';

export class CreateBannerDto {
  @IsExistsInTable('resource', 'id', { message: '图片不存在' })
  image: number;

  @IsOptional()
  @IsUrl({}, { message: '链接格式不正确' })
  link?: string;

  @IsOptional()
  @IsBoolean()
  enable: boolean;

  @IsOptional()
  order: number;
}
