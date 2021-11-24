import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Point } from './entities/point.entity';

export enum pointEnum {
  'register' = 100,
  'productCreate' = 10,
  'productSold' = 10,
  'productBought' = 10,
  'stuffCreate' = 5,
  'stuffConsume' = 5,
  'articleCreate' = 5,
  'commentCreate' = 5,
  'groupCreate' = 5,
  'groupComplete' = 5,
}

@Injectable()
export class PointService {
  constructor(
    @InjectRepository(Point)
    private readonly pointRepo: Repository<Point>,
  ) {}

  async create(user, amount, desc = null): Promise<Point> {
    return await this.pointRepo.save(
      this.pointRepo.create({
        user,
        amount,
        desc,
      }),
    );
  }

  async sumAll(user) {
    return await this.pointRepo.query(
      'SELECT SUM(amount) FROM point WHERE user = :user',
      [user],
    );
  }
}
