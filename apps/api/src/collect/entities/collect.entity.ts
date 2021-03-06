import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Transform } from 'class-transformer';
import * as moment from 'moment';
import { User } from 'apps/api/src/user/entities/user.entity';
import { Article } from 'apps/api/src/article/entities/article.entity';
import { Product } from '../../product/entities/product.entity';

@Entity()
@Unique(['collector', 'article', 'product'])
export class Collect {
  @PrimaryGeneratedColumn()
  id: number;

  @JoinColumn()
  @ManyToOne(() => User, (user) => user.collects, { eager: true })
  collector: number;

  @JoinColumn()
  @ManyToOne(() => Article, { eager: true })
  article: number;

  @JoinColumn()
  @ManyToOne(() => Product, { eager: true })
  product: number;

  @CreateDateColumn()
  @Transform((d) => moment(d.value).toDate().getTime())
  createTime: Date;
}
