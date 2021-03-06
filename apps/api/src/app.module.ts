import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ArticleModule } from './article/article.module';
import { CommentModule } from './comment/comment.module';
import { MessageModule } from './message/message.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CategoryModule } from './category/category.module';
import { StuffModule } from './stuff/stuff.module';
import { ResourceModule } from './resource/resource.module';
import { CollectModule } from './collect/collect.module';
import { BannerModule } from './banner/banner.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { SocketModule } from './socket/socket.module';
import { FavoriteModule } from './favorite/favorite.module';
import { RedisModule } from 'nestjs-redis';
import { CommonModule } from './common/common.module';
import { PointModule } from './point/point.module';
import { GroupOrderModule } from './group-order/group-order.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ScheduleService } from './schedule/schedule.service';
import { AppController } from './app.controller';
import { Feedback } from './feedback.entity';
import { Order } from './order/entities/order.entity';
import { GroupOrder } from './group-order/entities/group-order.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        db: configService.get('REDIS_DB'),
        password: configService.get('REDIS_PASSWORD'),
        keyPrefix: configService.get('REDIS_PREFIX'),
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('MYSQL_HOST'),
        port: configService.get('MYSQL_PORT'),
        username: configService.get('MYSQL_USERNAME'),
        password: configService.get('MYSQL_PASSWORD'),
        database: configService.get('MYSQL_DATABASE'),
        autoLoadEntities: true,
        synchronize: true,
        // logging: 'all',
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    UserModule,
    AuthModule,
    ArticleModule,
    CommentModule,
    MessageModule,
    CategoryModule,
    StuffModule,
    ResourceModule,
    CollectModule,
    BannerModule,
    ProductModule,
    OrderModule,
    SocketModule,
    FavoriteModule,
    CommonModule,
    PointModule,
    GroupOrderModule,
    TypeOrmModule.forFeature([Feedback, GroupOrder, Order]),
  ],
  providers: [ScheduleService],
  controllers: [AppController],
})
export class AppModule {
  /**
   * TODO:
   * generate default category
   * generate default resource
   */
}
