import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Point } from './entities/point.entity';
import { PointService } from './point.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Point])],
  providers: [PointService],
  exports: [PointService],
})
export class PointModule {}
