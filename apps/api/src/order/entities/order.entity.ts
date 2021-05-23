import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Product } from '../../product/entities/product.entity';
import { User } from '../../user/entities/user.entity';

import { OrderStatus } from '../orderStatus.enum';

@Entity()
@Unique(['product', 'buyer'])
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @JoinColumn()
  @ManyToOne(() => Product, (product) => product.orders, { eager: true })
  product: Product;

  @JoinColumn()
  @ManyToOne(() => User, (user) => user.sells, { eager: true })
  seller: User;

  @JoinColumn()
  @ManyToOne(() => User, (user) => user.buys, { eager: true })
  buyer: User;

  @Column({ default: OrderStatus.INIT })
  status: OrderStatus;

  buyers: any;
}
