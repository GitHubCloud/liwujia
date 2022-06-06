import {
  BadRequestException,
  forwardRef,
  HttpService,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'nestjs-redis';
import { inspect } from 'util';
import { UserService } from '../user/user.service';

export enum sceneEnum {
  '资料' = '1',
  '评论' = '2',
  '论坛' = '3',
  '社交日志' = '4',
}

export enum wechatType {
  'mini',
  'official',
}

@Injectable()
export class CommonService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly redisService: RedisService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  private readonly logger = new Logger('Common');
  private readonly redisClient = this.redisService.getClient();

  async getWechatAccessToken(type = wechatType.mini) {
    let APPID = this.configService.get('WECHAT_APPID');
    let SECRET = this.configService.get('WECHAT_SECRET');
    if (type == wechatType.official) {
      APPID = this.configService.get('OFFICIAL_WECHAT_APPID');
      SECRET = this.configService.get('OFFICIAL_WECHAT_SECRET');
    }

    let accessToken = await this.redisClient.get(`wechat:${type}:accessToken`);
    if (!accessToken) {
      const { data: tokenResult } = await this.httpService
        .get(
          `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`,
        )
        .toPromise();

      if (!tokenResult.access_token) {
        throw new BadRequestException('Unable to get access_token.');
      }
      accessToken = tokenResult.access_token;
      await this.redisClient.set(`wechat:${type}:accessToken`, accessToken);
      await this.redisClient.expire(`wechat:${type}:accessToken`, 600);
    }

    return accessToken;
  }

  async sendSubscribeMessage(body) {
    const accessToken = await this.getWechatAccessToken();

    const { data } = await this.httpService
      .post(
        `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
        body,
      )
      .toPromise();
    console.log(inspect({ body, data }, false, null, true));
  }

  async WechatMessageSecurityCheck(scene: sceneEnum, contents: any) {
    const accessToken = await this.getWechatAccessToken();

    // Security Check
    const { data: secResult } = await this.httpService
      .post(
        `https://api.weixin.qq.com/wxa/msg_sec_check?access_token=${accessToken}`,
        {
          scene,
          ...contents,
        },
      )
      .toPromise();

    if (secResult.errcode != 0 && secResult.errcode != 40001) {
      this.logger.error({ securityCheckFail: secResult });
      throw new BadRequestException('Security check failed.');
    }

    return true;
  }

  async updateSubscriber(next_openid = '') {
    const accessToken = await this.getWechatAccessToken(wechatType.official);

    const { data } = await this.httpService
      .get(
        `https://api.weixin.qq.com/cgi-bin/user/get?access_token=${accessToken}&next_openid=${next_openid}`,
      )
      .toPromise();
    if (!data?.count) return;

    for await (const openid of data?.data?.openid) {
      const { data: userData } = await this.httpService
        .get(
          `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${accessToken}&openid=${openid}`,
        )
        .toPromise();

      await this.userService.updateByUnionID(userData.unionid, {
        officialOpenID: openid,
      });
    }

    await this.updateSubscriber(data.next_openid);
  }

  async handleSubscribe(openid: string) {
    const accessToken = await this.getWechatAccessToken(wechatType.official);

    const { data: userData } = await this.httpService
      .get(
        `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${accessToken}&openid=${openid}`,
      )
      .toPromise();

    await this.userService.updateByUnionID(userData.unionid, {
      officialOpenID: openid,
    });
  }

  async handleUnsubscribe(openid: string) {
    await this.userService.updateByOfficialOpenID(openid, {
      officialOpenID: null,
    });
  }

  async sendTemplateMessage(body) {
    if (!body.touser) return false;
    const accessToken = await this.getWechatAccessToken(wechatType.official);

    const { data } = await this.httpService
      .post(
        `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`,
        body,
      )
      .toPromise();
    console.log(inspect({ body, data }, false, null, true));
  }
}
