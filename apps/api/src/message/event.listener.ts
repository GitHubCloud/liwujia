import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { User } from 'apps/api/src/user/entities/user.entity';
import * as moment from 'moment';
import { CommonService } from '../common/common.service';
import { GroupOrder } from '../group-order/entities/group-order.entity';
import { Order } from '../order/entities/order.entity';
import { pointEnum, PointService } from '../point/point.service';
import { MessageService } from './message.service';

@Injectable()
export class EventListener {
  constructor(
    private readonly messageService: MessageService,
    private readonly pointService: PointService,
    private readonly commonService: CommonService,
  ) {}
  @OnEvent('user.create')
  handleRegisterEvent(payload: User) {
    Logger.log(`Event 'user.create' emitted, id: '${payload.id}'.`);

    this.pointService.create(payload, pointEnum.register, 'register');
    this.messageService.create({
      to: payload.id,
      title: '恭喜你成功注册理物+',
      content:
        '恭喜你成功注册理物+，适度拥有记录点滴，和理物+一起打开生活密码。',
    });
  }

  @OnEvent('product.create')
  handleProductCreateEvent(payload: User) {
    Logger.log(`Event 'product.create' emitted, id: '${payload.id}'.`);

    this.pointService.create(payload, pointEnum.productCreate, 'productCreate');
  }

  @OnEvent('product.sold')
  handleProductSoldEvent(payload: User) {
    Logger.log(`Event 'product.sold' emitted, id: '${payload.id}'.`);

    this.pointService.create(payload, pointEnum.productSold, 'productSold');
  }

  @OnEvent('product.bought')
  handleProductBoughtEvent(payload: User) {
    Logger.log(`Event 'product.bought' emitted, id: '${payload.id}'.`);

    this.pointService.create(payload, pointEnum.productBought, 'productBought');
  }

  @OnEvent('product.replaceBuyer')
  handleProductReplaceBuyerEvent(payload: Order) {
    if (!payload) {
      return;
    }
    Logger.log(`Event 'product.replaceBuyer' emitted, id: '${payload.id}' .`);

    this.messageService.create({
      to: payload.buyer.id,
      content: '卖家已更换买家',
      order: payload.id,
    });
  }

  @OnEvent('stuff.create')
  handleStuffCreateEvent(payload: User) {
    Logger.log(`Event 'stuff.create' emitted, id: '${payload.id}'.`);

    this.pointService.create(payload, pointEnum.stuffCreate, 'stuffCreate');
  }

  @OnEvent('stuff.consume')
  handleStuffConsumeEvent(payload: User) {
    Logger.log(`Event 'stuff.consume' emitted, id: '${payload.id}'.`);

    this.pointService.create(payload, pointEnum.stuffConsume, 'stuffConsume');
  }

  @OnEvent('article.create')
  handleArticleCreateEvent(payload: User) {
    Logger.log(`Event 'article.create' emitted, id: '${payload.id}'.`);

    this.pointService.create(payload, pointEnum.articleCreate, 'articleCreate');
  }

  @OnEvent('comment.create')
  handleCommentCreateEvent(payload: User) {
    Logger.log(`Event 'comment.create' emitted, id: '${payload.id}'.`);

    this.pointService.create(payload, pointEnum.commentCreate, 'commentCreate');
  }

  @OnEvent('group.create')
  handleGroupCreateEvent(payload: User) {
    Logger.log(`Event 'group.create' emitted, id: '${payload.id}'.`);

    this.pointService.create(payload, pointEnum.groupCreate, 'groupCreate');
  }

  @OnEvent('group.complete')
  handleGroupCompleteEvent(payload: GroupOrder) {
    Logger.log(`Event 'group.complete' emitted, id: '${payload.id}'.`);

    this.pointService.create(
      payload.initiator,
      pointEnum.groupComplete,
      'groupComplete',
    );

    payload.joiner.map((i) => {
      this.pointService.create(i, pointEnum.groupComplete, 'groupComplete');
    });
  }

  @OnEvent('groupOrder.join')
  handleGroupOrderJoinEvent(payload: GroupOrder) {
    Logger.log(`Event 'groupOrder.join' emitted, id: '${payload.id}' .`);

    this.messageService.create({
      to: payload.initiator.id,
      content: '您发起的拼团有新的团员加入啦',
      groupOrder: payload.id,
    });
  }

  @OnEvent('groupOrder.leave')
  handleGroupOrderLeaveEvent(payload: GroupOrder) {
    Logger.log(`Event 'groupOrder.leave' emitted, id: '${payload.id}' .`);

    this.messageService.create({
      to: payload.initiator.id,
      content: '您发起的拼团有成员退出了',
      groupOrder: payload.id,
    });
  }

  @OnEvent('groupOrder.full')
  handleGroupOrderFullEvent(payload: GroupOrder) {
    Logger.log(`Event 'groupOrder.full' emitted, id: '${payload.id}' .`);

    this.messageService.create({
      to: payload.initiator.id,
      content: '您加入的拼团已经满员啦',
      groupOrder: payload.id,
    });
    if (payload.initiator.wechatOpenID) {
      this.commonService.sendSubscribeMessage({
        touser: payload.initiator.wechatOpenID,
        template_id: 'WLP27zK4ISz2bpUfP_01UF3t1AP8oUYxGLMuYpYJ7ts',
        page: 'pages/group/my/index',
        data: {
          thing1: {
            value: payload.title,
          },
          time3: {
            value: moment().format('YYYY年MM月DD日 HH:mm'),
          },
          phrase4: {
            value: '已满员',
          },
        },
      });
    }

    payload.joiner.map((i) => {
      this.messageService.create({
        to: i.id,
        content: '您加入的拼团已经满员啦',
        groupOrder: payload.id,
      });

      if (i.wechatOpenID) {
        this.commonService.sendSubscribeMessage({
          touser: i.wechatOpenID,
          template_id: 'WLP27zK4ISz2bpUfP_01UF3t1AP8oUYxGLMuYpYJ7ts',
          page: 'pages/group/my/index',
          data: {
            thing1: {
              value: payload.title,
            },
            time3: {
              value: moment().format('YYYY年MM月DD日 HH:mm'),
            },
            phrase4: {
              value: '已满员',
            },
          },
        });
      }
    });
  }

  @OnEvent('groupOrder.initiatorCancel')
  handleGroupOrderInitatorCancelEvent(payload: GroupOrder) {
    Logger.log(
      `Event 'groupOrder.initiatorCancel' emitted, id: '${payload.id}' .`,
    );

    payload.joiner.map((i) => {
      this.messageService.create({
        to: i.id,
        content: '您加入的拼团发起人已取消',
        groupOrder: payload.id,
      });
    });
  }

  @OnEvent('groupOrder.joinerCancel')
  handleGroupOrderJoinerCancelEvent(payload: GroupOrder) {
    Logger.log(
      `Event 'groupOrder.joinerCancel' emitted, id: '${payload.id}' .`,
    );

    this.messageService.create({
      to: payload.initiator.id,
      content: '您加入的拼团有成员退出已被自动取消',
      groupOrder: payload.id,
    });

    payload.joiner.map((i) => {
      this.messageService.create({
        to: i.id,
        content: '您加入的拼团有成员退出已被自动取消',
        groupOrder: payload.id,
      });
    });
  }

  @OnEvent('groupOrder.autoCancel')
  handleGroupOrderAutoCancelEvent(payload: GroupOrder) {
    Logger.log(`Event 'groupOrder.autoCancel' emitted, id: '${payload.id}' .`);

    this.messageService.create({
      to: payload.initiator.id,
      content: '您加入的拼团截止时间未成团已自动取消',
      groupOrder: payload.id,
    });

    payload.joiner.map((i) => {
      this.messageService.create({
        to: i.id,
        content: '您加入的拼团截止时间未成团已自动取消',
        groupOrder: payload.id,
      });
    });
  }
}
