import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { CommentController } from './comment.controller';
import { Article } from '../article/entities/article.entity';
import { Product } from '../product/entities/product.entity';
import { GroupOrder } from '../group-order/entities/group-order.entity';
import { FavoriteModule } from '../favorite/favorite.module';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, Article, Product, GroupOrder, User]),
    FavoriteModule,
  ],
  providers: [CommentService],
  exports: [CommentService],
  controllers: [CommentController],
})
export class CommentModule {}
