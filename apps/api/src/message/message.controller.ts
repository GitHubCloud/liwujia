import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './entities/message.entity';
import { PaginationDto } from 'apps/api/src/pagination.dto';
import { Pagination } from 'nestjs-typeorm-paginate';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Message')
@Controller('message')
@UseInterceptors(ClassSerializerInterceptor)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(
    @Req() req,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    return await this.messageService.create(createMessageDto);
  }

  @Get()
  async paginate(
    @Query() paginationDto: PaginationDto,
  ): Promise<Pagination<Message>> {
    return await this.messageService.paginate(paginationDto);
  }
}
