import {
  AfterLoad,
  Column,
  CreateDateColumn,
  createQueryBuilder,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Resource } from '../../resource/entities/resource.entity';
import { User } from '../../user/entities/user.entity';
import { Transform } from 'class-transformer';
import * as moment from 'moment';
import { Comment } from '../../comment/entities/comment.entity';

export enum GroupOrderStatus {
  'CANCELED' = 'canceled',
  'INIT' = 'init',
  'COMPLETE' = 'complete',
}

@Entity()
export class GroupOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  describe: string;

  @Column()
  latitude: string;

  @Column()
  longitude: string;

  @Column()
  position: string;

  @Column({ default: 0 })
  price: number;

  @Column()
  joinLimit: number;

  @Column()
  @Transform((d) => moment(d.value).toDate().getTime())
  deadline: Date;

  @JoinTable()
  @ManyToMany(() => Resource, { cascade: true, eager: true })
  images?: Resource[];

  @JoinColumn()
  @ManyToOne(() => User, (user) => user.groupOrder, { eager: true })
  initiator: User;

  @JoinTable()
  @ManyToMany(() => User, { cascade: true, eager: true })
  joiner?: User[];

  @JoinColumn()
  @OneToMany(() => Comment, (comment) => comment.groupOrder)
  comments: number;

  @CreateDateColumn()
  @Transform((d) => moment(d.value).toDate().getTime())
  createTime: Date;

  @Column({ default: GroupOrderStatus.INIT })
  status: GroupOrderStatus;

  @AfterLoad()
  async afterLoad() {
    if (!this.images || !this.images.length) {
      const defaultImage = await createQueryBuilder(Resource)
        .where('id = 1')
        .getOne();

      this.images = [defaultImage];
    }
  }
}