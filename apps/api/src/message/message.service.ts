import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { PaginationDto } from 'apps/api/src/pagination.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './entities/message.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async create(createMessageDto: CreateMessageDto): Promise<Message> {
    return await this.messageRepo.save(
      this.messageRepo.create(createMessageDto),
    );
  }

  async paginate(paginationDto: PaginationDto): Promise<Pagination<Message>> {
    const { page, limit } = paginationDto;
    return await paginate(this.messageRepo, { page, limit });
  }
}
