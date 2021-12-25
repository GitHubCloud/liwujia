import { Module } from '@nestjs/common';
import { FavoriteController } from './favorite.controller';
import { FavoriteService } from './favorite.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite } from './entities/favorite.entity';
import { Article } from '../article/entities/article.entity';
import { Product } from '../product/entities/product.entity';
import { Comment } from '../comment/entities/comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Favorite, Article, Product, Comment])],
  controllers: [FavoriteController],
  providers: [FavoriteService],
  exports: [FavoriteService],
})
export class FavoriteModule {}
