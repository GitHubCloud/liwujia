import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { User } from 'apps/api/src/user/entities/user.entity';
import * as moment from 'moment';
import { RedisService } from 'nestjs-redis';
import { Comment } from '../comment/entities/comment.entity';
import { CommonService } from '../common/common.service';
import { GroupOrder } from '../group-order/entities/group-order.entity';
import { Order } from '../order/entities/order.entity';
import { pointEnum, PointService } from '../point/point.service';
import { Product } from '../product/entities/product.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageService } from './message.service';

@Injectable()
export class EventListener {
  constructor(
    private readonly messageService: MessageService,
    private readonly pointService: PointService,
    private readonly commonService: CommonService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  private redisClient = this.redisService.getClient();

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
  handleProductCreateEvent(payload: Product) {
    Logger.log(`Event 'product.create' emitted, id: '${payload.id}'.`);

    this.redisClient.lpush(
      `marquee`,
      `"${payload.owner.nickname}"发布了闲置"${payload.content}"`,
    );

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

  @OnEvent('order.create')
  async handleOrderCreateEvent(payload: Order) {
    Logger.log(`Event 'order.create' emitted, id: '${payload.id}'.`);

    this.redisClient.lpush(
      `marquee`,
      `"${payload.buyer.nickname}"想要闲置"${payload.product.content}"`,
    );

    this.messageService.create({
      to: payload.seller.id,
      content: '您的订单有新的买家',
      order: payload.id,
    });

    if (payload.seller.wechatOpenID) {
      const isPushed = await this.redisClient.hget(
        `subscribe:productOrder:${payload.product.id}`,
        payload.seller.wechatOpenID,
      );

      if (!isPushed) {
        this.commonService.sendSubscribeMessage({
          touser: payload.seller.wechatOpenID,
          template_id: 'Tfu-OZnetf6LyJ-QbWAaGKMyi4WeJb6o1LJQSvX1MNs',
          page: 'pages/order/sell/index',
          data: {
            thing1: {
              value: payload.buyer.nickname.substring(0, 16),
            },
            time3: {
              value: moment(payload.createTime).format('YYYY年MM月DD日 HH:mm'),
            },
            thing9: {
              value: payload.product.content.substring(0, 16),
            },
            amount7: {
              value: payload.product.price,
            },
          },
        });
        this.redisClient.hset(
          `subscribe:productOrder:${payload.product.id}`,
          payload.seller.wechatOpenID,
          1,
        );
      }
    }

    this.commonService.sendTemplateMessage({
      touser: payload.seller.officialOpenID,
      template_id: 'O0pZKjkBiQBIicQaget9cRvBC9FqO2Aw4tkpc85P88o',
      miniprogram: {
        appid: this.configService.get('WECHAT_APPID'),
        pagepath: 'pages/order/sell/index',
      },
      topcolor: '#FF0000',
      data: {
        first: {
          value: '您的订单有新的买家'.substring(0, 16),
          color: '#173177',
        },
        keyword1: {
          value: payload.product.content.substring(0, 16),
          color: '#173177',
        },
        keyword2: {
          value: payload.product.price,
          color: '#173177',
        },
        keyword3: {
          value: moment(payload.createTime).format('YYYY年MM月DD日 HH:mm'),
          color: '#173177',
        },
        /* keyword4: {
          value: '',
          color: '#173177',
        },
        remark: {
          value: '',
          color: '#173177',
        }, */
      },
    });
  }

  @OnEvent('order.message')
  async handleOrderMessageEvent(payload: Order, messageDto: CreateMessageDto) {
    if (!messageDto.from || !messageDto.to) return;
    Logger.log(`Event 'order.message' emitted, id: '${payload.id}' .`);

    let target = null;
    if (messageDto.to == payload.buyer.id) {
      target = payload.buyer;
    } else if (messageDto.to == payload.seller.id) {
      target = payload.seller;
    }

    if (target.wechatOpenID) {
      const isPushed = await this.redisClient.hget(
        `subscribe:orderMessage:${payload.id}`,
        target.wechatOpenID,
      );
      if (!isPushed) {
        this.commonService.sendSubscribeMessage({
          touser: target.wechatOpenID,
          template_id: 'rKad24nzu47td4XAQLJQcm8e2AZSMYYdmxH7SEQGT8s',
          page: `pages/order/contact/index?id=${payload.id}`,
          data: {
            name1: {
              value: target.nickname.substring(0, 16),
            },
            date3: {
              value: moment(payload.createTime).format('YYYY年MM月DD日 HH:mm'),
            },
            thing2: {
              value: messageDto.content.substring(0, 16),
            },
            thing8: {
              value: `${payload.product.content}`.substring(0, 16),
            },
          },
        });
        await this.redisClient.hset(
          `subscribe:orderMessage:${payload.id}`,
          target.wechatOpenID,
          1,
        );
      }
    }

    this.commonService.sendTemplateMessage({
      touser: target.officialOpenID,
      template_id: 'KUUl3n88fRvhvXKrSn1NJ32vQIc8sbuybej-3sr7UW4',
      miniprogram: {
        appid: this.configService.get('WECHAT_APPID'),
        pagepath: `pages/order/contact/index?id=${payload.id}`,
      },
      topcolor: '#FF0000',
      data: {
        first: {
          value: '您的闲置有新的消息'.substring(0, 16),
          color: '#173177',
        },
        keyword1: {
          value: '闲置私聊',
          color: '#173177',
        },
        keyword2: {
          value: `${payload.product.content}`.substring(0, 16),
          color: '#173177',
        },
        /* keyword3: {
          value: '理物加',
          color: '#173177',
        }, */
        remark: {
          value: messageDto.content.substring(0, 16),
          color: '#173177',
        },
      },
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
    Logger.log(`Event 'article.create' emitted, id: '${payload}'.`);

    this.pointService.create(payload, pointEnum.articleCreate, 'articleCreate');
  }

  @OnEvent('comment.create')
  handleCommentCreateEvent(payload: User, comment: Comment) {
    Logger.log(`Event 'comment.create' emitted, id: '${payload.id}'.`);

    let pagepath = '';
    if (comment.article) {
      pagepath = `pages/find/article/index?id=${comment.article}`;
    } else if (comment.product) {
      pagepath = `pages/order/detail/index?id=${comment.product}`;
    } else if (comment.groupOrder) {
      pagepath = `pages/group/detail/index?id=${comment.groupOrder}`;
    }

    this.commonService.sendTemplateMessage({
      touser: payload.officialOpenID,
      template_id: 'dpu3XUAS1safkL9EA85Tv2vMOBWTs_jXK5SDkZ5eroI',
      miniprogram: {
        appid: this.configService.get('WECHAT_APPID'),
        pagepath,
      },
      topcolor: '#FF0000',
      data: {
        first: {
          value: '您收到了新的评论'.substring(0, 16),
          color: '#173177',
        },
        keyword1: {
          value: comment.author.nickname.substring(0, 16),
          color: '#173177',
        },
        keyword2: {
          value: moment(comment.createTime).format('YYYY年MM月DD日 HH:mm'),
          color: '#173177',
        },
        keyword3: {
          value: `${comment?.image ? '[图片]' : ''}${
            comment?.content
          }`.substring(0, 16),
          color: '#173177',
        },
        /* remark: {
          value: '',
          color: '#173177',
        }, */
      },
    });

    this.pointService.create(
      payload.id,
      pointEnum.commentCreate,
      'commentCreate',
    );
  }

  @OnEvent('group.create')
  handleGroupCreateEvent(payload: User, group: GroupOrder) {
    Logger.log(`Event 'group.create' emitted, id: '${payload.id}'.`);

    this.redisClient.lpush(
      `marquee`,
      `"${payload.nickname}"发布了拼团"${group.title}"`,
    );

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

  @OnEvent('groupOrder.message')
  async handleGroupOrderMessageEvent(
    payload: GroupOrder,
    messageDto: CreateMessageDto,
  ) {
    Logger.log(`Event 'groupOrder.message' emitted, id: '${payload.id}' .`);

    let sender = payload.initiator;
    payload.joiner.map((i) => {
      if (i.id == messageDto.from) sender = i;
    });

    if (payload.initiator.wechatOpenID && sender.id != payload.initiator.id) {
      const isPushed = await this.redisClient.hget(
        `subscribe:groupMessage:${payload.id}`,
        payload.initiator.wechatOpenID,
      );
      if (!isPushed) {
        this.commonService.sendSubscribeMessage({
          touser: payload.initiator.wechatOpenID,
          template_id: 'rKad24nzu47td4XAQLJQcpNduHHG1G0E6vT7gPOCltE',
          page: `pages/group/contact/index?id=${payload.id}`,
          data: {
            name1: {
              value: sender.nickname.substring(0, 16),
            },
            date3: {
              value: moment().format('YYYY年MM月DD日 HH:mm'),
            },
            thing5: {
              value: messageDto.content.substring(0, 16),
            },
            thing8: {
              value: `${payload.title}`.substring(0, 16),
            },
          },
        });
        await this.redisClient.hset(
          `subscribe:groupMessage:${payload.id}`,
          payload.initiator.wechatOpenID,
          1,
        );
      }

      this.commonService.sendTemplateMessage({
        touser: payload.initiator.officialOpenID,
        template_id: 'KUUl3n88fRvhvXKrSn1NJ32vQIc8sbuybej-3sr7UW4',
        miniprogram: {
          appid: this.configService.get('WECHAT_APPID'),
          pagepath: `pages/group/contact/index?id=${payload.id}`,
        },
        topcolor: '#FF0000',
        data: {
          first: {
            value: '您的拼团有新的消息'.substring(0, 16),
            color: '#173177',
          },
          keyword1: {
            value: '拼团群聊',
            color: '#173177',
          },
          keyword2: {
            value: payload.title.substring(0, 16),
            color: '#173177',
          },
          keyword3: {
            value: sender.nickname.substring(0, 16),
            color: '#173177',
          },
          remark: {
            value: messageDto.content.substring(0, 16),
            color: '#173177',
          },
        },
      });
    }

    for (const i in payload.joiner) {
      if (payload.joiner[i].wechatOpenID && sender.id != payload.joiner[i].id) {
        const isPushed = await this.redisClient.hget(
          `subscribe:groupMessage:${payload.id}`,
          payload.joiner[i].wechatOpenID,
        );
        if (!isPushed) {
          this.commonService.sendSubscribeMessage({
            touser: payload.joiner[i].wechatOpenID,
            template_id: 'rKad24nzu47td4XAQLJQcpNduHHG1G0E6vT7gPOCltE',
            page: `pages/group/contact/index?id=${payload.id}`,
            data: {
              name1: {
                value: sender.nickname.substring(0, 16),
              },
              date3: {
                value: moment().format('YYYY年MM月DD日 HH:mm'),
              },
              thing5: {
                value: messageDto.content.substring(0, 16),
              },
              thing8: {
                value: `${payload.title}`.substring(0, 16),
              },
            },
          });
          await this.redisClient.hset(
            `subscribe:groupMessage:${payload.id}`,
            payload.joiner[i].wechatOpenID,
            1,
          );
        }

        this.commonService.sendTemplateMessage({
          touser: payload.joiner[i].officialOpenID,
          template_id: 'KUUl3n88fRvhvXKrSn1NJ32vQIc8sbuybej-3sr7UW4',
          miniprogram: {
            appid: this.configService.get('WECHAT_APPID'),
            pagepath: `pages/group/contact/index?id=${payload.id}`,
          },
          topcolor: '#FF0000',
          data: {
            first: {
              value: '您的拼团有新的消息'.substring(0, 16),
              color: '#173177',
            },
            keyword1: {
              value: '拼团群聊',
              color: '#173177',
            },
            keyword2: {
              value: `${payload.title}`.substring(0, 16),
              color: '#173177',
            },
            keyword3: {
              value: sender.nickname.substring(0, 16),
              color: '#173177',
            },
            remark: {
              value: messageDto.content.substring(0, 16),
              color: '#173177',
            },
          },
        });
      }
    }
  }

  @OnEvent('groupOrder.join')
  handleGroupOrderJoinEvent(payload: GroupOrder, user: User) {
    Logger.log(`Event 'groupOrder.join' emitted, id: '${payload.id}' .`);

    this.redisClient.lpush(
      `marquee`,
      `"${user.nickname}"加入了拼团"${payload.title}"`,
    );

    this.messageService.create({
      to: payload.initiator.id,
      content: '您发起的拼团有新的团员加入啦',
      groupOrder: payload.id,
    });

    if (payload.joinLimit != payload.joiner.length) {
      if (payload.initiator.wechatOpenID) {
        this.commonService.sendSubscribeMessage({
          touser: payload.initiator.wechatOpenID,
          template_id: 'ZfvL1Iwwn9lk0RT1vYwIa7IJmblcbiyvAyiS4WoApok',
          page: `pages/group/contact/index?id=${payload.id}`,
          data: {
            thing1: {
              value: payload.initiator.nickname.substring(0, 16),
            },
            thing2: {
              value: payload.title.substring(0, 16),
            },
            time5: {
              value: moment().format('YYYY年MM月DD日 HH:mm'),
            },
          },
        });
      }
      if (payload.initiator.officialOpenID) {
        this.commonService.sendTemplateMessage({
          touser: payload.initiator.officialOpenID,
          template_id: 'ABaonbk_ou1hG9Fwc1Mg7QfmqoWAIxowm5j6EtEH-UM',
          miniprogram: {
            appid: this.configService.get('WECHAT_APPID'),
            pagepath: `pages/group/contact/index?id=${payload.id}`,
          },
          topcolor: '#FF0000',
          data: {
            first: {
              value: '您发起的拼团有新的成员'.substring(0, 16),
              color: '#173177',
            },
            keyword1: {
              value: payload.title.substring(0, 16),
              color: '#173177',
            },
            keyword2: {
              value: payload.joiner.length,
              color: '#173177',
            },
            keyword3: {
              value: moment().format('YYYY年MM月DD日 HH:mm'),
              color: '#173177',
            },
            remark: {
              value: '',
              color: '#173177',
            },
          },
        });
      }
      payload.joiner.map((i) => {
        if (user.id != i.id) {
          if (i.wechatOpenID) {
            this.commonService.sendSubscribeMessage({
              touser: i.wechatOpenID,
              template_id: 'ZfvL1Iwwn9lk0RT1vYwIa7IJmblcbiyvAyiS4WoApok',
              page: `pages/group/contact/index?id=${payload.id}`,
              data: {
                thing1: {
                  value: i.nickname.substring(0, 16),
                },
                thing2: {
                  value: payload.title.substring(0, 16),
                },
                time5: {
                  value: moment().format('YYYY年MM月DD日 HH:mm'),
                },
              },
            });
          }
          if (i.officialOpenID) {
            this.commonService.sendTemplateMessage({
              touser: i.officialOpenID,
              template_id: 'ABaonbk_ou1hG9Fwc1Mg7QfmqoWAIxowm5j6EtEH-UM',
              miniprogram: {
                appid: this.configService.get('WECHAT_APPID'),
                pagepath: `pages/group/contact/index?id=${payload.id}`,
              },
              topcolor: '#FF0000',
              data: {
                first: {
                  value: '您参与的拼团有新的成员'.substring(0, 16),
                  color: '#173177',
                },
                keyword1: {
                  value: payload.title.substring(0, 16),
                  color: '#173177',
                },
                keyword2: {
                  value: payload.joiner.length,
                  color: '#173177',
                },
                keyword3: {
                  value: moment().format('YYYY年MM月DD日 HH:mm'),
                  color: '#173177',
                },
                remark: {
                  value: '',
                  color: '#173177',
                },
              },
            });
          }
        }
      });
    }
  }

  @OnEvent('groupOrder.kick')
  handleGroupOrderKickEvent(payload: GroupOrder, target: User) {
    Logger.log(`Event 'groupOrder.kick' emitted, id: '${payload.id}' .`);

    this.messageService.create({
      to: target.id,
      content:
        '由于您长时间未响应，您已被团主移除此拼团群，下次拼团请记得及时参与交流沟通哦。',
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
        page: `/pages/group/contact/index?id=${payload.id}`,
        data: {
          thing1: {
            value: payload.title.substring(0, 16),
          },
          time3: {
            value: moment().format('YYYY年MM月DD日 HH:mm'),
          },
          phrase4: {
            value: '已满员',
          },
        },
      });
      this.commonService.sendTemplateMessage({
        touser: payload.initiator.officialOpenID,
        template_id: 'Z-9a3LUJA4CuiPcBfapVCkPuTK6RhKk_afBPiaw6xxk',
        miniprogram: {
          appid: this.configService.get('WECHAT_APPID'),
          pagepath: `/pages/group/contact/index?id=${payload.id}`,
        },
        topcolor: '#FF0000',
        data: {
          first: {
            value: '您加入的拼团已经满员啦'.substring(0, 16),
            color: '#173177',
          },
          keyword1: {
            value: payload.title.substring(0, 16),
            color: '#173177',
          },
          keyword2: {
            value: payload.initiator.nickname.substring(0, 16),
            color: '#173177',
          },
          keyword3: {
            value: payload.joiner.length,
            color: '#173177',
          },
          /* remark: {
            value: '',
            color: '#173177',
          }, */
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
          page: `/pages/group/contact/index?id=${payload.id}`,
          data: {
            thing1: {
              value: payload.title.substring(0, 16),
            },
            time3: {
              value: moment().format('YYYY年MM月DD日 HH:mm'),
            },
            phrase4: {
              value: '已满员',
            },
          },
        });
        this.commonService.sendTemplateMessage({
          touser: i.officialOpenID,
          template_id: 'Z-9a3LUJA4CuiPcBfapVCkPuTK6RhKk_afBPiaw6xxk',
          miniprogram: {
            appid: this.configService.get('WECHAT_APPID'),
            pagepath: `/pages/group/contact/index?id=${payload.id}`,
          },
          topcolor: '#FF0000',
          data: {
            first: {
              value: '您加入的拼团已经满员啦'.substring(0, 16),
              color: '#173177',
            },
            keyword1: {
              value: payload.title.substring(0, 16),
              color: '#173177',
            },
            keyword2: {
              value: payload.initiator.nickname.substring(0, 16),
              color: '#173177',
            },
            keyword3: {
              value: payload.joiner.length,
              color: '#173177',
            },
            /* remark: {
              value: '',
              color: '#173177',
            }, */
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
