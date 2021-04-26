import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getRepository, Repository } from 'typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './entities/comment.entity';
import { PaginationDto } from 'apps/api/src/pagination.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
  ) {}

  async create(createCommentDto: CreateCommentDto): Promise<Comment> {
    if (!createCommentDto.article && createCommentDto.replyTo) {
      const parentComment = await this.commentRepo.findOne(
        createCommentDto.replyTo,
        { loadRelationIds: true },
      );
      createCommentDto.article = parentComment.article;
    }

    return await this.commentRepo.save(
      this.commentRepo.create(createCommentDto),
    );
  }

  async paginate(paginationDto: PaginationDto): Promise<Pagination<Comment>> {
    const { page, limit, query } = paginationDto;

    const queryBuilder = getRepository(Comment)
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.replys', 'replys')
      .leftJoinAndSelect('replys.author', 'replys.author')
      .leftJoinAndSelect('comment.author', 'author')
      .where(query);
    return await paginate(queryBuilder, { page, limit });
  }

  async findOne(id: number): Promise<Comment> {
    return await this.commentRepo.findOne(id);
  }
}
