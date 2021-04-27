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
import { User } from 'apps/api/src/user/entities/user.entity';
import { Comment } from 'apps/api/src/comment/entities/comment.entity';
import { ArticleTypes } from '../articleType.enum';

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('enum', { enum: ArticleTypes })
  type: ArticleTypes;

  @Column({ nullable: true })
  tags?: string;

  @Column({ nullable: true })
  content?: string;

  @JoinColumn()
  @ManyToOne(() => User, (user) => user.articles, { eager: true })
  author: number;

  @JoinColumn()
  @OneToMany(() => Comment, (comment) => comment.article)
  comments: number;

  @CreateDateColumn()
  @Transform((d) => moment(d.value).toDate().getTime())
  createTime: Date;

  @Column({ default: 0 })
  favorite: number;
}
