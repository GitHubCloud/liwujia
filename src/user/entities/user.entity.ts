import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude, Transform } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import * as moment from 'moment';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  avatar: string;

  @Column()
  nickname: string;

  @Exclude()
  @Column()
  loginPasswd: string;

  @CreateDateColumn()
  @Transform((d) => moment(d.value).toDate().getTime())
  createTime: Date;

  @BeforeInsert()
  encryptPasswd() {
    this.loginPasswd = bcrypt.hashSync(
      this.loginPasswd,
      bcrypt.genSaltSync(10),
    );
  }
}
