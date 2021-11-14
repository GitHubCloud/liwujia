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
import { RedisService } from 'nestjs-redis';
import { IsNull, Not } from 'typeorm';
import { CommonService, sceneEnum } from '../common/common.service';

@ApiTags('Message')
@Controller('message')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(AuthGuard('jwt'))
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly redisService: RedisService,
    private readonly commonService: CommonService,
  ) {}

  @Post()
  async create(
    @Req() req,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    await this.commonService.WechatMessageSecurityCheck(sceneEnum.社交日志, {
      content: createMessageDto.content,
    });

    return await this.messageService.create(createMessageDto, req.user);
  }

  @Get()
  async paginate(
    @Req() req,
    @Query('type') type: string,
    @Query('order') order: number,
    @Query('groupOrder') groupOrder: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<Pagination<Message>> {
    if (order) {
      paginationDto.query = {
        order,
        from: Not(IsNull()),
      };
    }
    if (groupOrder) {
      paginationDto.query = {
        groupOrder,
        from: Not(IsNull()),
      };
    }

    return await this.messageService.paginate(paginationDto, req.user, type);
  }

  @Get('count')
  async count(@Req() req) {
    const redisClient = this.redisService.getClient();
    const data = {
      total: 0,
      favorites:
        Number(await redisClient.get(`message:favorite:${req.user.id}`)) || 0,
      collects:
        Number(await redisClient.get(`message:collect:${req.user.id}`)) || 0,
      comments:
        Number(await redisClient.get(`message:comment:${req.user.id}`)) || 0,
      orders:
        Number(await redisClient.get(`message:order:${req.user.id}`)) || 0,
      groupOrders:
        Number(await redisClient.get(`message:groupOrder:${req.user.id}`)) || 0,
      system:
        Number(await redisClient.get(`message:system:${req.user.id}`)) || 0,
    };
    data.total =
      data.favorites +
      data.collects +
      data.comments +
      data.orders +
      data.groupOrders +
      data.system;

    return data;
  }
}
