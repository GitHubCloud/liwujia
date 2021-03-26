import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Transform } from 'class-transformer';
import * as moment from 'moment';
import { User } from 'src/user/entities/user.entity';
import { Article } from 'src/article/entities/article.entity';

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
  @ManyToOne(() => Comment, (comment) => comment.replys)
  replyTo: number;

  @JoinColumn()
  @OneToMany(() => Comment, (comment) => comment.replyTo)
  replys: number;

  @CreateDateColumn()
  @Transform((d) => moment(d.value).toDate().getTime())
  createTime: Date;
}
