import { Transform } from 'class-transformer';
import * as moment from 'moment';
import { Category } from 'apps/api/src/category/entities/category.entity';
import { User } from 'apps/api/src/user/entities/user.entity';
import {
  AfterLoad,
  Column,
  CreateDateColumn,
  createQueryBuilder,
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
  category: Category;

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
  async afterLoad() {
    let expirationDate = _.get(this, 'detail.expirationDate', null);
    const openDate = _.get(this, 'detail.openDate', null);
    const openLimit = _.get(this, 'detail.openLimit', null);

    if (openDate && openLimit) {
      if (
        moment(openDate).add(openLimit, 'month').isBefore(expirationDate) ||
        !expirationDate
      ) {
        expirationDate = moment(openDate).add(openLimit, 'month');
      }
    }

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

    // 被消耗的
    if (this.isConsumed || this.isWasted) {
      this.color = StuffColor.蓝灯;
    }

    if (!this.image) {
      const defaultImage = await createQueryBuilder(Resource)
        .where('id = 1')
        .getOne();

      this.image = defaultImage;
    }
  }
}
