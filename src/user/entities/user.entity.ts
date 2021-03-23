import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  avatar: string;

  @Column()
  nickname: string;

  @Column()
  loginPasswd: string;

  @CreateDateColumn()
  createTime: Date;

  @BeforeInsert()
  encryptPasswd() {
    this.loginPasswd = bcrypt.hashSync(
      this.loginPasswd,
      bcrypt.genSaltSync(10),
    );
  }
}
