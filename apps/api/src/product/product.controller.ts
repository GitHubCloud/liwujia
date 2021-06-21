import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Req,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Query,
  Put,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PaginationDto } from '../pagination.dto';
import { Pagination } from 'nestjs-typeorm-paginate';
import { CreateCommentDto } from '../comment/dto/create-comment.dto';
import { CommentService } from '../comment/comment.service';
import { Comment } from '../comment/entities/comment.entity';
import { Like } from 'typeorm';

@ApiTags('Product')
@Controller('product')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(AuthGuard('jwt'))
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly commentService: CommentService,
  ) {}

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
    @Query() paginationDto: PaginationDto,
    @Query('owner') owner?: number,
    @Query('isSold') isSold?: boolean,
    @Query('search') search?: string,
  ): Promise<Pagination<Product>> {
    paginationDto.query = {};
    if (owner) paginationDto.query['owner'] = owner;
    if (search) paginationDto.query['content'] = Like(`%${search}%`);
    paginationDto.query['isSold'] = !!isSold;

    return this.productService.paginate(paginationDto, req.user);
  }

  @Get(':id')
  async findOne(@Req() req, @Param('id') id: number): Promise<Product> {
    return this.productService.findOne(id, req.user);
  }

  @Put('/:id/favorite')
  async favorite(@Req() req, @Param('id') id: number) {
    return await this.productService.favorite(req.user, id);
  }

  @Put('/:id/collect')
  async collect(@Req() req, @Param('id') id: number) {
    return await this.productService.collect(req.user, id);
  }

  @Put(':id')
  async update(
    @Req() req,
    @Param('id') id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return await this.productService.update(id, updateProductDto, req.user);
  }

  @Post('/:id/comment')
  async createComment(
    @Req() req,
    @Param('id') id: number,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    createCommentDto.product = id;
    createCommentDto.author = req.user.id;

    return await this.commentService.create(createCommentDto);
  }

  @Get('/:id/comment')
  async paginateComment(
    @Param('id') id: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<Pagination<Comment>> {
    paginationDto.query = {
      product: id,
      replyTo: null,
    };

    return await this.commentService.paginate(paginationDto);
  }

  @Delete(':id')
  async remove(@Req() req, @Param('id') id: number) {
    return await this.productService.remove(id, req.user);
  }
}
