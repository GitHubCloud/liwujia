import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../../product/entities/product.entity';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @JoinColumn()
  @ManyToOne(() => Product, (product) => product.orders)
  product: number;

  @JoinColumn()
  @ManyToOne(() => User, (user) => user.sells, { eager: true })
  seller: number;

  @JoinColumn()
  @ManyToOne(() => User, (user) => user.buys, { eager: true })
  buyer: number;
}
