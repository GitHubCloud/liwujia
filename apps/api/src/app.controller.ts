import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { getRepository, Repository } from 'typeorm';
import { Feedback } from './feedback.entity';
import { PaginationDto } from './pagination.dto';

@ApiTags('App')
@Controller('/')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(AuthGuard('jwt'))
export class AppController {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepo: Repository<Feedback>,
  ) {}

  @Post('feedback')
  async feedback(@Req() req, @Body('content') content): Promise<Feedback> {
    return await this.feedbackRepo.save({
      creator: req.user.id,
      content,
    });
  }

  @Get('feedback')
  async getFeedbacks(
    @Req() req,
    @Query() paginationDto: PaginationDto,
  ): Promise<Pagination<Feedback>> {
    const { page, limit, query } = paginationDto;

    const queryBuilder = getRepository(Feedback)
      .createQueryBuilder('feedback')
      .leftJoinAndSelect('feedback.creator', 'creator')
      .where(query);

    return paginate(queryBuilder, { page, limit });
  }
}
