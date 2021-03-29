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
import { Article } from 'src/article/entities/article.entity';
import { Comment } from 'src/comment/entities/comment.entity';
import { Message } from 'src/message/entities/message.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  avatar?: string;

  @Column()
  nickname: string;

  @Exclude()
  @Column()
  loginPasswd: string;

  @CreateDateColumn()
  @Transform((d) => moment(d.value).toDate().getTime())
  createTime: Date;

  @JoinColumn()
  @OneToMany(() => Article, (article) => article.author)
  articles: number;

  @JoinColumn()
  @OneToMany(() => Comment, (comment) => comment.author)
  comments: number;

  @JoinColumn()
  @OneToMany(() => Message, (message) => message.from)
  messagesSend: number;

  @JoinColumn()
  @OneToMany(() => Message, (message) => message.to)
  messagesReceive: number;

  @BeforeInsert()
  encryptPasswd() {
    this.loginPasswd = bcrypt.hashSync(
      this.loginPasswd,
      bcrypt.genSaltSync(10),
    );
  }
}
