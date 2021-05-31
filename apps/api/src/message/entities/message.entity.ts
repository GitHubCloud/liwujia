import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Transform } from 'class-transformer';
import * as moment from 'moment';
import { User } from 'apps/api/src/user/entities/user.entity';
import { Order } from '../../order/entities/order.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @JoinColumn()
  @ManyToOne(() => User, (user) => user.messagesSend, { eager: true })
  from: number;

  @JoinColumn()
  @ManyToOne(() => User, (user) => user.messagesReceive, { eager: true })
  to: number;

  @JoinColumn()
  @ManyToOne(() => Order)
  order: number;

  @CreateDateColumn()
  @Transform((d) => moment(d.value).toDate().getTime())
  createTime: Date;
}
