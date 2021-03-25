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

  @BeforeInsert()
  encryptPasswd() {
    this.loginPasswd = bcrypt.hashSync(
      this.loginPasswd,
      bcrypt.genSaltSync(10),
    );
  }
}
