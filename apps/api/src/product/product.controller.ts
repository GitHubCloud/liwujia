import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PaginationDto } from '../pagination.dto';
import { Pagination } from 'nestjs-typeorm-paginate';

@ApiTags('Stuff')
@Controller('product')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(AuthGuard('jwt'))
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async create(
    @Req() req,
    @Body() createProductDto: CreateProductDto,
  ): Promise<Product> {
    createProductDto.owner = req.user.id;

    return await this.productService.create(createProductDto);
  }

  @Get()
  async paginate(
    @Req() req,
    @Query('owner') owner: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<Pagination<Product>> {
    paginationDto.query = {};
    if (owner) paginationDto.query['owner'] = owner;

    return this.productService.paginate(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(+id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(+id);
  }
}
