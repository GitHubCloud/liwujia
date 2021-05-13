import { Transform } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Resource } from '../../resource/entities/resource.entity';
import * as moment from 'moment';

@Entity()
export class Banner {
  @PrimaryGeneratedColumn()
  id: number;

  @JoinColumn()
  @ManyToOne(() => Resource, { eager: true })
  image: number;

  @Column({ nullable: true })
  link: string;

  @Column({ default: 0, unsigned: true })
  order: number;

  @Column({ default: true })
  enable: boolean;

  @CreateDateColumn()
  @Transform((d) => moment(d.value).toDate().getTime())
  createTime: Date;
}
