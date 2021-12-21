import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  Put,
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
  async getMyFeedbacks(
    @Req() req,
    @Query() paginationDto: PaginationDto,
  ): Promise<Pagination<Feedback>> {
    let { page, limit, query } = paginationDto;
    query = query ? (query['creator'] = req.user.id) : { creator: req.user.id };

    const queryBuilder = getRepository(Feedback)
      .createQueryBuilder('feedback')
      .leftJoinAndSelect('feedback.creator', 'creator')
      .where(query)
      .orderBy('feedback.id', 'DESC');

    return paginate(queryBuilder, { page, limit });
  }

  @Get('feedback/all')
  async getFeedbacks(
    @Req() req,
    @Query() paginationDto: PaginationDto,
  ): Promise<Pagination<Feedback>> {
    const { page, limit, query } = paginationDto;

    const queryBuilder = getRepository(Feedback)
      .createQueryBuilder('feedback')
      .leftJoinAndSelect('feedback.creator', 'creator')
      .where(query)
      .orderBy('feedback.id', 'DESC');

    return paginate(queryBuilder, { page, limit });
  }

  @Put('feedback/:id')
  async response(
    @Req() req,
    @Param('id') id: number,
    @Body('response') response,
  ) {
    return await this.feedbackRepo.update(id, {
      response,
    });
  }
}
