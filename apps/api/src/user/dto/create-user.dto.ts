import {
  IsNotEmpty,
  IsOptional,
  IsUrl,
  Matches,
  ValidateIf,
} from 'class-validator';
import * as _ from 'lodash';
import { IsExistsInTable } from '../../custom.decorator';

export class CreateUserDto {
  @IsOptional()
  @IsExistsInTable('resource', 'id', { message: '头像不存在' })
  avatar?: number;

  @ValidateIf((o) => _.isEmpty(o.wechatOpenID))
  @IsNotEmpty({ message: '昵称不能为空' })
  nickname?: string;

  @ValidateIf((o) => _.isEmpty(o.loginPasswd))
  @IsNotEmpty({ message: '关键信息不能为空' })
  wechatOpenID?: string;

  @ValidateIf((o) => _.isEmpty(o.wechatOpenID))
  @Matches(
    /^(?=.*([a-zA-Z].*))(?=.*[0-9].*)[a-zA-Z0-9-*/+.~!@#$%^&*()]{8,100}$/,
    { message: '密码至少包含一个数字和字母，且长度 8 位以上' },
  )
  loginPasswd?: string;
}
