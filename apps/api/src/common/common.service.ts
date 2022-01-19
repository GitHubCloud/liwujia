import {
  BadRequestException,
  HttpService,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'nestjs-redis';

export enum sceneEnum {
  '资料' = '1',
  '评论' = '2',
  '论坛' = '3',
  '社交日志' = '4',
}

@Injectable()
export class CommonService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly redisService: RedisService,
  ) {}

  private readonly logger = new Logger('Common');
  private readonly redisClient = this.redisService.getClient();

  async getWechatAccessToken() {
    const APPID = this.configService.get('WECHAT_APPID');
    const SECRET = this.configService.get('WECHAT_SECRET');

    let accessToken = await this.redisClient.get('wechat:accessToken');
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
      await this.redisClient.set('wechat:accessToken', accessToken);
      await this.redisClient.expire('wechat:accessToken', 600);
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
    console.log({ data });
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
}
