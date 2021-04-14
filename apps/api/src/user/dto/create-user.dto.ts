import { IsNotEmpty, IsOptional, IsUrl, Matches } from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @IsUrl({}, { message: '头像上传不正确' })
  avatar?: string;

  @IsNotEmpty({ message: '昵称不能为空' })
  nickname: string;

  @Matches(
    /^(?=.*([a-zA-Z].*))(?=.*[0-9].*)[a-zA-Z0-9-*/+.~!@#$%^&*()]{8,100}$/,
    { message: '密码至少包含一个数字和字母，且长度 8 位以上' },
  )
  loginPasswd: string;
}
