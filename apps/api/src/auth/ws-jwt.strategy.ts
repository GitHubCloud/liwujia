import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as _ from 'lodash';

@Injectable()
export class WsJwtStrategy extends PassportStrategy(Strategy, 'wsJwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          return _.last(
            _.get(request, 'handshake.headers.authorization', '').split(' '),
          );
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return { ...payload };
  }
}
