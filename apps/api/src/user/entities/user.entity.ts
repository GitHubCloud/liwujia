import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude, Transform } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import * as moment from 'moment';
import { Article } from 'apps/api/src/article/entities/article.entity';
import { Comment } from 'apps/api/src/comment/entities/comment.entity';
import { Message } from 'apps/api/src/message/entities/message.entity';
import { Stuff } from 'apps/api/src/stuff/entities/stuff.entity';
import { Collect } from 'apps/api/src/collect/entities/collect.entity';
import { Product } from 'apps/api/src/product/entities/product.entity';
import { Order } from 'apps/api/src/order/entities/order.entity';
import { Point } from 'apps/api/src/point/entities/point.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  avatar?: string;

  @Column()
  nickname: string;

  @Column({ nullable: true })
  biography?: string;

  @Exclude()
  @Column({ nullable: true })
  loginPasswd?: string;

  @Column({ nullable: true, unique: true })
  wechatOpenID?: string;

  @CreateDateColumn()
  @Transform((d) => moment(d.value).toDate().getTime())
  createTime: Date;

  @JoinColumn()
  @OneToMany(() => Stuff, (stuff) => stuff.owner)
  stuffs: number;

  @JoinColumn()
  @OneToMany(() => Product, (product) => product.owner)
  products: number;

  @JoinColumn()
  @OneToMany(() => Article, (article) => article.author)
  articles: number;

  @JoinColumn()
  @OneToMany(() => Comment, (comment) => comment.author)
  comments: number;

  @JoinColumn()
  @OneToMany(() => Collect, (collect) => collect.collector)
  collects: number;

  @JoinColumn()
  @OneToMany(() => Order, (order) => order.seller)
  sells: number;

  @JoinColumn()
  @OneToMany(() => Order, (order) => order.buyer)
  buys: number;

  @JoinColumn()
  @OneToMany(() => Message, (message) => message.from)
  messagesSend: number;

  @JoinColumn()
  @OneToMany(() => Message, (message) => message.to)
  messagesReceive: number;

  @JoinColumn()
  @OneToMany(() => Point, (point) => point.user)
  points: number;

  @BeforeInsert()
  encryptPasswd() {
    if (this.loginPasswd) {
      this.loginPasswd = bcrypt.hashSync(
        this.loginPasswd,
        bcrypt.genSaltSync(10),
      );
    }

    if (!this.nickname) {
      this.nickname = `理物小能手${Math.random().toString(36).substring(7)}`;
    }
  }
}
