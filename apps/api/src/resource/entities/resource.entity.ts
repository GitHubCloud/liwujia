import {
  AfterInsert,
  AfterLoad,
  AfterUpdate,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Expose, Transform } from 'class-transformer';
import * as moment from 'moment';
import { ConfigService } from '@nestjs/config';

@Entity()
export class Resource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ossPath: string;

  @Column()
  size: number;

  @Column()
  mime: string;

  @Column({ type: 'json', nullable: true })
  label?: {
    x: number;
    y: number;
    text: string;
  };

  @CreateDateColumn()
  @Transform((d) => moment(d.value).toDate().getTime())
  createTime: Date;

  @Expose()
  cdnPath: string;

  @AfterLoad()
  @AfterInsert()
  @AfterUpdate()
  setCdnPath() {
    this.cdnPath = `${new ConfigService().get('CDN_PATH')}${this.ossPath}`;
  }
}
