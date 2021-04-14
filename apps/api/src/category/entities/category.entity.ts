import { Transform } from 'class-transformer';
import * as moment from 'moment';
import { Stuff } from 'apps/api/src/stuff/entities/stuff.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'json', nullable: true })
  fields?: any;

  @JoinColumn()
  @OneToMany(() => Stuff, (stuff) => stuff.category)
  stuffs: number;

  @CreateDateColumn()
  @Transform((d) => moment(d.value).toDate().getTime())
  createTime: Date;
}
