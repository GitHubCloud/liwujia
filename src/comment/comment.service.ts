import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getRepository, Repository } from 'typeorm';
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

    /* const queryBuilder = await getRepository(Comment)
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.replys', 'replys') // limit 1
      .leftJoinAndSelect('comment.author', 'author')
      .where(query);
    console.log(queryBuilder.getSql());
    return await paginate(queryBuilder, { page, limit }); */

    return await paginate(
      this.commentRepo,
      { page, limit },
      {
        where: query,
      },
    );
  }

  async findOne(id: number): Promise<Comment> {
    return await this.commentRepo.findOne(id);
  }
}
