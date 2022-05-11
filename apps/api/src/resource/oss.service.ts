import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ObsClient from 'esdk-obs-nodejs';
import * as OssClient from 'ali-oss';
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

  async uploadAli(
    file: { originalname: string; filename: any; path: any },
    dest = 'public',
  ) {
    const _dest = _.trim(_.trim(dest, '\\'), '/');
    const ext = `.${_.last(file.originalname.split('.'))}`;
    let storePath = `${_dest}`;
    storePath += `/${moment().format('YYYY/MM')}`;
    storePath += `/${file.filename}${ext}`;

    const client = new OssClient({
      // yourregion填写Bucket所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
      region: this.configService.get('OSS_REGION'),
      // 阿里云账号AccessKey拥有所有API的访问权限，风险很高。强烈建议您创建并使用RAM用户进行API访问或日常运维，请登录RAM控制台创建RAM用户。
      accessKeyId: this.configService.get('OSS_AK'),
      accessKeySecret: this.configService.get('OSS_SK'),
      // 填写Bucket名称。关于Bucket名称命名规范的更多信息，请参见Bucket。
      bucket: this.configService.get('OSS_BUCKET'),
    });

    const headers = {
      // 指定该Object被下载时网页的缓存行为。
      // 'Cache-Control': 'no-cache',
      // 指定该Object被下载时的名称。
      // 'Content-Disposition': 'oss_download.txt',
      // 指定该Object被下载时的内容编码格式。
      // 'Content-Encoding': 'UTF-8',
      // 指定过期时间。
      // 'Expires': 'Wed, 08 Jul 2022 16:57:01 GMT',
      // 指定Object的存储类型。
      // 'x-oss-storage-class': 'Standard',
      // 指定Object的访问权限。
      // 'x-oss-object-acl': 'private',
      // 设置Object的标签，可同时设置多个标签。
      // 'x-oss-tagging': 'Tag1=1&Tag2=2',
      // 指定CopyObject操作时是否覆盖同名目标Object。此处设置为true，表示禁止覆盖同名Object。
      // 'x-oss-forbid-overwrite': 'true',
    };

    try {
      // 填写OSS文件完整路径和本地文件的完整路径。OSS文件完整路径中不能包含Bucket名称。
      // 如果本地文件的完整路径中未指定本地路径，则默认从示例程序所属项目对应本地路径中上传文件。
      // const result = await client.put('exampleobject.txt', path.normalize('D:\\localpath\\examplefile.txt'), { headers });
      const result = await client.put(storePath, file.path);
      console.log(result);
    } catch (e) {
      console.log(e);
    }

    return storePath;
  }
}
