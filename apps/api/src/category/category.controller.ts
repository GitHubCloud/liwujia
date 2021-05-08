import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { Category } from './entities/category.entity';

@ApiTags('Category')
@Controller('category')
@UseInterceptors(ClassSerializerInterceptor)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Req() req): Promise<Category[]> {
    return this.categoryService.findAll(req.user);
  }
}
