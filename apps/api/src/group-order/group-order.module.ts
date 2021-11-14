import { Module } from '@nestjs/common';
import { GroupOrderService } from './group-order.service';
import { GroupOrderController } from './group-order.controller';
import { GroupOrder } from './entities/group-order.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
import { CommentModule } from '../comment/comment.module';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupOrder, User]),
    CommonModule,
    CommentModule,
  ],
  controllers: [GroupOrderController],
  providers: [GroupOrderService],
  exports: [GroupOrderService],
})
export class GroupOrderModule {}
