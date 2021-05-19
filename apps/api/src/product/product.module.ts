import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Resource } from '../resource/entities/resource.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Resource])],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
