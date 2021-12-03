import {
  AfterLoad,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
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

  @Column({ default: 0, type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column()
  category: string;

  @Column({ nullable: true })
  brand: string;

  @Column()
  quality: string;

  @Column({ default: false })
  isSold: boolean;

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

  @DeleteDateColumn()
  deleteTime: Date;

  buyers: User[];
  isCollected: boolean;
  isFavorite: boolean;
  isOrdered: boolean;
  isLocked: boolean;

  @AfterLoad()
  async afterLoad() {
    this.price = Number(this.price) ? this.price : 0;
  }
}
