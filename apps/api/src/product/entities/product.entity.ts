import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Transform } from 'class-transformer';
import * as moment from 'moment';
import { Resource } from '../../resource/entities/resource.entity';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @JoinTable()
  @ManyToMany(() => Resource, { cascade: true, eager: true })
  images?: Resource[];

  @Column()
  latitude: string;

  @Column()
  longitude: string;

  @Column()
  position: string;

  @Column()
  price: number;

  @Column()
  category: string;

  @Column()
  brand: string;

  @Column()
  quality: string;

  @JoinColumn()
  @ManyToOne(() => User, (user) => user.products, { eager: true })
  owner: number;

  @CreateDateColumn()
  @Transform((d) => moment(d.value).toDate().getTime())
  createTime: Date;
}
