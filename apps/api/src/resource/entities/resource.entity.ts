import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Expose, Transform } from 'class-transformer';
import * as moment from 'moment';
import { ConfigService } from '@nestjs/config';
import { Stuff } from '../../stuff/entities/stuff.entity';
import { User } from '../../user/entities/user.entity';
import { Article } from '../../article/entities/article.entity';

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

  @Expose()
  get cdnPath(): string {
    return `${new ConfigService().get('CDN_PATH')}${this.ossPath}`;
  }

  @JoinColumn()
  @OneToOne(() => Stuff, (stuff) => stuff.image)
  stuff: number;

  @JoinColumn()
  @ManyToOne(() => Article, (article) => article.images)
  article: number;

  @JoinColumn()
  @OneToOne(() => User, (user) => user.avatar)
  user: number;

  @CreateDateColumn()
  @Transform((d) => moment(d.value).toDate().getTime())
  createTime: Date;
}
