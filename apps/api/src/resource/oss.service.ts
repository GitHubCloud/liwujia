import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ObsClient from 'esdk-obs-nodejs';
import * as _ from 'lodash';
import * as moment from 'moment';

@Injectable()
export class OssService {
  constructor(private readonly configService: ConfigService) {}

  async upload(
    file: { originalname: string; filename: any; path: any },
    dest = 'public',
  ) {
    const _dest = _.trim(_.trim(dest, '\\'), '/');
    const ext = `.${_.last(file.originalname.split('.'))}`;
    let storePath = `${_dest}`;
    storePath += `/${moment().format('YYYY/MM')}`;
    storePath += `/${file.filename}${ext}`;

    const obsClient = new ObsClient({
      access_key_id: this.configService.get('OSS_AK'),
      secret_access_key: this.configService.get('OSS_SK'),
      server: this.configService.get('OSS_ENDPOINT'),
      max_retry_count: 2,
      timeout: 30,
      ssl_verify: false,
      long_conn_param: 0,
    });

    obsClient.putObject({
      Bucket: this.configService.get('OSS_BUCKET'),
      Key: storePath,
      SourceFile: file.path,
    });

    return storePath;
  }
}
