import { Injectable } from '@nestjs/common';
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
    const { entities, raw } = await getRepository(Category)
      .createQueryBuilder('category')
      .addSelect('COUNT(stuffs.id)', 'stuffs')
      .leftJoin('category.stuffs', 'stuffs', 'stuffs.owner = :userid', {
        userid: user.id,
      })
      .groupBy('category.id')
      .getRawAndEntities();

    entities.map((item, index) => {
      item.stuffs = raw[index].stuffs;
    });

    return entities;
  }

  async findOne(id: number): Promise<Category> {
    return this.categoryRepo.findOne(id);
  }
}
