import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Resource } from '../resource/entities/resource.entity';
import { CollectModule } from '../collect/collect.module';
import { CommentModule } from '../comment/comment.module';
import { Order } from '../order/entities/order.entity';
import { FavoriteModule } from '../favorite/favorite.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Resource, Order]),
    CommonModule,
    CommentModule,
    CollectModule,
    FavoriteModule,
  ],
  exports: [ProductService],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
