import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Transform } from 'class-transformer';
import { User } from 'src/user/entities/user.entity';
import * as moment from 'moment';

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  tags?: string;

  @Column()
  content: string;

  @JoinColumn()
  @ManyToOne(() => User, (user) => user.articles, { eager: true })
  author: number;

  @CreateDateColumn()
  @Transform((d) => moment(d.value).toDate().getTime())
  createTime: Date;

  @Column({ default: 0 })
  favorite: number;
}
