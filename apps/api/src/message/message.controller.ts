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
@UseGuards(AuthGuard('jwt'))
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  async create(
    @Req() req,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    return await this.messageService.create(createMessageDto, req.user);
  }

  @Get()
  async paginate(
    @Req() req,
    @Query('order') order: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<Pagination<Message>> {
    paginationDto.query = {};
    if (order) {
      paginationDto.query['order'] = order;
    } else {
      paginationDto.query['to'] = req.user.id;
      paginationDto.query['order'] = null;
    }

    return await this.messageService.paginate(paginationDto);
  }
}
