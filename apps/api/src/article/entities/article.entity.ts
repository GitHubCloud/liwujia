import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Transform } from 'class-transformer';
import * as moment from 'moment';
import { User } from 'apps/api/src/user/entities/user.entity';
import { Comment } from 'apps/api/src/comment/entities/comment.entity';
import { Resource } from 'apps/api/src/resource/entities/resource.entity';
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
  latitude?: string;

  @Column({ nullable: true })
  longitude?: string;

  @Column({ nullable: true })
  position?: string;

  @Column({ nullable: true })
  orderIndex?: number;

  @JoinTable()
  @ManyToMany(() => Resource, { cascade: true, eager: true })
  images?: Resource[];

  @Column({ type: 'text', nullable: true })
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

  @Column({ type: 'datetime' })
  @Transform((d) => moment(d.value).toDate().getTime())
  updateTime: Date;

  @DeleteDateColumn()
  @Transform((d) => moment(d.value).toDate().getTime())
  deleteTime: Date;

  @Column({ default: 0 })
  favorite: number;

  @Column({ default: 0 })
  collect: number;

  isCollected: boolean;
  isFavorite: boolean;
}
