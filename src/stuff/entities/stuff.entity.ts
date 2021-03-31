import { Transform } from 'class-transformer';
import * as moment from 'moment';
import { Category } from 'src/category/entities/category.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Stuff {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @JoinColumn()
  @ManyToOne(() => Category, (category) => category.stuffs, { eager: true })
  category: number;

  @Column({ type: 'json', nullable: true })
  detail?: any;

  @JoinColumn()
  @ManyToOne(() => User, (user) => user.stuffs, { eager: true })
  owner: number;

  @CreateDateColumn()
  @Transform((d) => moment(d.value).toDate().getTime())
  createTime: Date;
}
