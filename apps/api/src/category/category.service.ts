import { Injectable, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getRepository, Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async findAll(user: any): Promise<Category[]> {
    return await getRepository(Category)
      .createQueryBuilder('category')
      .leftJoin('category.stuffs', 'stuffs', 'stuffs.owner = :userid', {
        userid: user.id,
      })
      .addSelect('COUNT(stuffs.id) as stuffs')
      .groupBy('category.id')
      .execute();
  }

  async findOne(id: number): Promise<Category> {
    return this.categoryRepo.findOne(id);
  }
}
