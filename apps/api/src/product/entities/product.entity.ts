import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Transform } from 'class-transformer';
import * as moment from 'moment';
import { Resource } from '../../resource/entities/resource.entity';
import { User } from '../../user/entities/user.entity';
import { Comment } from '../../comment/entities/comment.entity';
import { Order } from '../../order/entities/order.entity';

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

  @Column({ default: 0 })
  price: number;

  @Column()
  category: string;

  @Column()
  brand: string;

  @Column()
  quality: string;

  @JoinColumn()
  @ManyToOne(() => User, (user) => user.products, { eager: true })
  owner: User;

  @JoinColumn()
  @OneToMany(() => Comment, (comment) => comment.product)
  comments: number;

  @JoinColumn()
  @OneToMany(() => Order, (order) => order.product)
  orders: number;

  @CreateDateColumn()
  @Transform((d) => moment(d.value).toDate().getTime())
  createTime: Date;

  @Column({ default: 0 })
  favorite: number;

  @Column({ default: 0 })
  collect: number;

  isCollected: boolean;
  isFavorite: boolean;
}
