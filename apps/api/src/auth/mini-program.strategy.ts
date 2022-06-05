// import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import {
  HttpService,
  Injectable,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import passport, { StrategyCreated, StrategyCreatedStatic } from 'passport';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { CommonService } from '../common/common.service';

// define strategy
class Strategy implements passport.Strategy {
  name: string;
  codeField: string;
  verify: any;

  constructor(options: any, verify: any) {
    if (typeof options == 'function') {
      verify = options;
      options = {};
    }
    if (!verify) {
      throw new TypeError('MiniProgramStrategy requires a verify callback');
    }

    this.name = 'miniProgram';
    this.verify = verify;
    this.codeField = options.codeField || 'code';
  }

  authenticate(
    this: StrategyCreated<StrategyCreatedStatic, any>,
    @Req() req,
    options?: any,
  ) {
    const code = (req.body || req.query)[this.codeField];
    const channel = (req.body || req.query)['channel'];
    if (!code) {
      return this.fail(options.badRequestMessage || 'Missing credentials', 400);
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const verifyed = function (err: any, user: any, info: any) {
      if (err) {
        return self.error(err);
      } else if (!user) {
        return self.fail(info);
      } else {
        return self.success(user, info);
      }
    };

    try {
      this.verify(code, channel, verifyed);
    } catch (ex) {
      return self.error(ex);
    }
  }
}

@Injectable()
export class MiniProgramStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly commonService: CommonService,
  ) {
    super();
  }

  async validate(code: string, channel: string): Promise<any> {
    const APPID = this.configService.get('WECHAT_APPID');
    const SECRET = this.configService.get('WECHAT_SECRET');

    const endpoint = 'https://api.weixin.qq.com/sns/jscode2session';
    const { data } = await this.httpService
      .get(
        `${endpoint}?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`,
      )
      .toPromise();

    if (data.errcode || !data.openid) {
      throw new UnauthorizedException(data.errmsg || null);
    }
    let exists = await this.userService.findByOpenID(data.openid);
    console.log({
      code,
      data,
      exists,
    });

    if (!exists) {
      exists = await this.userService.create({
        wechatOpenID: data.openid,
        unionid: data.unionid,
        channel,
      });
      exists.isNewbie = true;
    }

    if (exists && !exists.unionid) {
      await this.userService.update(exists.id, {
        unionid: data.unionid,
      });
      exists.unionid = data.unionid;
    }

    return {
      // ...data,
      ...exists,
    };
  }
}
