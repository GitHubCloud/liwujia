import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getConnection, Repository } from 'typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './entities/comment.entity';
import { PaginationDto } from 'src/pagination.dto';

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

    return await paginate(
      this.commentRepo,
      { page, limit },
      {
        where: query,
        relations: ['replys'],
      },
    );
  }

  async findOne(id: number): Promise<Comment> {
    return await this.commentRepo.findOne(id);
  }
}
