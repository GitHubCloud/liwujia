import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { User } from 'apps/api/src/user/entities/user.entity';
import { Order } from '../order/entities/order.entity';
import { pointEnum, PointService } from '../point/point.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageService } from './message.service';

@Injectable()
export class EventListener {
  constructor(
    private readonly messageService: MessageService,
    private readonly pointService: PointService,
  ) {}
  @OnEvent('user.create')
  handleRegisterEvent(payload: User) {
    Logger.log(`Event 'user.create' emitted, id: '${payload.id}'.`);

    const createMessageDto = new CreateMessageDto();
    createMessageDto.to = payload.id;
    createMessageDto.title = '恭喜你成功注册理物+';
    createMessageDto.content =
      '恭喜你成功注册理物+，适度拥有记录点滴，和理物+一起打开生活密码。';

    this.pointService.create(payload, pointEnum.register, 'register');
    this.messageService.create(createMessageDto);
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
}
