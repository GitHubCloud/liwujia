import { Transform } from 'class-transformer';
import * as moment from 'moment';
import { Category } from 'apps/api/src/category/entities/category.entity';
import { User } from 'apps/api/src/user/entities/user.entity';
import {
  AfterLoad,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Resource } from '../../resource/entities/resource.entity';
import { StuffColor } from '../stuffColor.enum';
import * as _ from 'lodash';

@Entity()
export class Stuff {
  @PrimaryGeneratedColumn()
  id: number;

  @JoinColumn()
  @OneToOne(() => Resource, { eager: true })
  image?: Resource;

  @Column()
  name: string;

  @JoinColumn()
  @ManyToOne(() => Category, (category) => category.stuffs, { eager: true })
  category: number;

  @Column({ default: false })
  isConsumed: boolean;

  @Column({ default: false })
  isWasted: boolean;

  @Column({ type: 'json', nullable: true })
  detail?: any;

  @JoinColumn()
  @ManyToOne(() => User, (user) => user.stuffs, { eager: true })
  owner: number;

  @CreateDateColumn()
  @Transform((d) => moment(d.value).toDate().getTime())
  createTime: Date;

  color: StuffColor;
  remainDate: number;

  @AfterLoad()
  afterLoad() {
    const expirationDate = _.get(this, 'detail.expirationDate', null);
    const remainDays = _.get(this, 'detail.remainDays', null);
    if (expirationDate && remainDays) {
      const remainDate = moment(expirationDate).subtract(remainDays, 'day');
      if (moment(expirationDate).isBefore()) {
        this.color = StuffColor.红灯;
      } else if (moment(remainDate).isBefore()) {
        this.color = StuffColor.黄灯;
      } else {
        this.color = StuffColor.绿灯;
      }

      this.detail['remainDate'] = moment(expirationDate)
        .subtract(remainDays, 'day')
        .toDate()
        .getTime();
      this.detail['expireDays'] = Math.ceil(
        moment(expirationDate).diff(new Date()) / 86400000,
      );
    } else {
      this.color = StuffColor.紫灯;
    }
  }
}
