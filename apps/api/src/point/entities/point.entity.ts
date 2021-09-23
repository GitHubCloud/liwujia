import { Transform } from 'class-transformer';
import * as moment from 'moment';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Point {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  @Transform((d) => moment(d.value).toDate().getTime())
  createTime: Date;

  @JoinColumn()
  @ManyToOne(() => User, (user) => user.points)
  user: number;

  @Column()
  amount: number;

  @Column()
  desc: string;
}
