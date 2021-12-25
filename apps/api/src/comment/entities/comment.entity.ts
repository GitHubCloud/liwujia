import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Transform } from 'class-transformer';
import * as moment from 'moment';
import { User } from 'apps/api/src/user/entities/user.entity';
import { Article } from 'apps/api/src/article/entities/article.entity';
import { Product } from '../../product/entities/product.entity';
import { GroupOrder } from '../../group-order/entities/group-order.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @JoinColumn()
  @ManyToOne(() => User, (user) => user.comments, { eager: true })
  author: number;

  @JoinColumn()
  @ManyToOne(() => Article, (article) => article.comments)
  article: number;

  @JoinColumn()
  @ManyToOne(() => Product, (product) => product.comments)
  product: number;

  @JoinColumn()
  @ManyToOne(() => GroupOrder, (groupOrder) => groupOrder.comments)
  groupOrder: number;

  @JoinColumn()
  @ManyToOne(() => Comment, (comment) => comment.replys)
  replyTo: number;

  @JoinColumn()
  @OneToMany(() => Comment, (comment) => comment.replyTo)
  replys: number;

  @CreateDateColumn()
  @Transform((d) => moment(d.value).toDate().getTime())
  createTime: Date;

  @DeleteDateColumn()
  @Transform((d) => moment(d.value).toDate().getTime())
  deleteTime: Date;

  @Column({ default: 0 })
  favorite: number;

  isFavorite: boolean;
}
