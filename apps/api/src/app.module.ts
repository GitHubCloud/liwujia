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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
        logging: 'all',
      }),
      inject: [ConfigService],
    }),
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
  ],
})
export class AppModule {}
