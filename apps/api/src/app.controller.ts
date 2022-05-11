import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpException,
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
import { RedisService } from 'nestjs-redis';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { getRepository, Repository } from 'typeorm';
import { MessageService } from './message/message.service';
import { CreateMessageDto } from './message/dto/create-message.dto';
import { CommonService } from './common/common.service';
import { Feedback } from './feedback.entity';
import { GroupOrder } from './group-order/entities/group-order.entity';
import { Order } from './order/entities/order.entity';
import { PaginationDto } from './pagination.dto';
import * as _ from 'lodash';

@ApiTags('App')
@Controller('/')
@UseInterceptors(ClassSerializerInterceptor)
export class AppController {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepo: Repository<Feedback>,
    @InjectRepository(GroupOrder)
    private readonly groupOrderRepo: Repository<GroupOrder>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly redisService: RedisService,
    private readonly commonService: CommonService,
    private readonly messageService: MessageService,
  ) {}

  private redisClient = this.redisService.getClient();

  @Get()
  async home() {
    return '<h1>理物加</h1><br><a href="https://beian.miit.gov.cn/" target="_blank">沪ICP备2021015643号-1</a>';
  }

  @Get('marquee')
  @UseGuards(AuthGuard('jwt'))
  async marquee() {
    return await this.redisClient.lrange('marquee', 0, 100);
  }

  @Put('notify')
  @UseGuards(AuthGuard('jwt'))
  async notify(
    @Req() req,
    @Body('id') id: number,
    @Body('type') type: 'group' | 'order',
  ) {
    let entity = null;
    let sender = null;
    let targets = [];
    let msg = '';
    switch (type) {
      case 'group':
        entity = await this.groupOrderRepo.findOne(id);
        if (entity?.initiator?.id == req.user.id) {
          sender = entity?.initiator;
          targets = entity?.joiner;
          msg = '团主提示您及时关注拼团进程';
        } else {
          sender = (entity?.joiner || []).find((i) => i.id == req.user.id);
          targets = [entity?.initiator];
          msg = '团员提示您及时关注拼团进程';
        }
        break;
      case 'order':
        entity = await this.orderRepo.findOne(id);
        if (entity?.seller?.id == req.user.id) {
          sender = entity?.seller;
          targets = [entity?.buyer];
          msg = '卖家提示您及时关注闲置交易进程';
        } else {
          sender = entity?.buyer;
          targets = [entity?.seller];
          msg = '买家提示您及时关注闲置交易进程';
        }
        break;
    }

    if (_.isEmpty(sender) || _.isEmpty(entity) || _.isEmpty(targets)) {
      throw new HttpException('没有可以提醒的对象', 400);
    }
    const isPushed = await this.redisClient.hget(
      `subscribe:${type}Notify:${entity.id}`,
      sender.wechatOpenID,
    );
    if (isPushed) throw new HttpException('已经发送过提醒', 400);

    await this.redisClient.hset(
      `subscribe:${type}Notify:${entity.id}`,
      sender.wechatOpenID,
      1,
    );
    targets.map(async (target) => {
      const isReceived = await this.redisClient.hget(
        `subscribe:${type}NotifyReceived:${entity.id}`,
        target.wechatOpenID,
      );

      if (!isReceived) {
        this.commonService.sendSubscribeMessage({
          touser: target.wechatOpenID,
          template_id: '7EH3_iuPNBcmjT8eVS86-55SyGkY35LLNmmoevzvtzs',
          page: `pages/${type}/contact/index?id=${entity.id}`,
          data: {
            thing3: {
              value: (entity?.product?.content || entity?.title).substring(
                0,
                16,
              ),
            },
            thing5: {
              value: msg,
            },
          },
        });
        await this.redisClient.hset(
          `subscribe:${type}NotifyReceived:${entity.id}`,
          target.wechatOpenID,
          1,
        );
      }
    });

    const messageDto = new CreateMessageDto();
    messageDto['from'] = sender.id;
    messageDto[type == 'group' ? 'groupOrder' : 'order'] = id;
    messageDto['content'] = '系统消息：发起了取货提醒';
    await this.messageService.create(messageDto, req.user);
  }

  @Post('feedback')
  @UseGuards(AuthGuard('jwt'))
  async feedback(@Req() req, @Body('content') content): Promise<Feedback> {
    return await this.feedbackRepo.save({
      creator: req.user.id,
      content,
    });
  }

  @Get('feedback')
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
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
