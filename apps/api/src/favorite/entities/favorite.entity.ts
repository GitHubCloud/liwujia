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
import { Comment } from '../../comment/entities/comment.entity';

@Entity()
@Unique(['user', 'article', 'product'])
export class Favorite {
  @PrimaryGeneratedColumn()
  id: number;

  @JoinColumn()
  @ManyToOne(() => User, (user) => user.collects, { eager: true })
  user: number;

  @JoinColumn()
  @ManyToOne(() => Article, { eager: true })
  article: number;

  @JoinColumn()
  @ManyToOne(() => Product, { eager: true })
  product: number;

  @JoinColumn()
  @ManyToOne(() => Comment, { eager: true })
  comment: number;

  @CreateDateColumn()
  @Transform((d) => moment(d.value).toDate().getTime())
  createTime: Date;
}
