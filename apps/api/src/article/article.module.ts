import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { Comment } from 'apps/api/src/comment/entities/comment.entity';
import { CommentModule } from 'apps/api/src/comment/comment.module';
import { Resource } from '../resource/entities/resource.entity';
import { CollectModule } from '../collect/collect.module';
import { FavoriteModule } from '../favorite/favorite.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, Comment, Resource]),
    CommentModule,
    CollectModule,
    FavoriteModule,
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}
