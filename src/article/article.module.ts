import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { Comment } from 'src/comment/entities/comment.entity';
import { CommentModule } from 'src/comment/comment.module';

@Module({
  imports: [TypeOrmModule.forFeature([Article, Comment]), CommentModule],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}
