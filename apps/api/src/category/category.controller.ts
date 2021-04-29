import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { Category } from './entities/category.entity';

@ApiTags('Category')
@Controller('category')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(): Promise<Category[]> {
    return this.categoryService.findAll();
  }
}
