import { Module } from '@nestjs/common';
import { StuffService } from './stuff.service';
import { StuffController } from './stuff.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stuff } from './entities/stuff.entity';
import { CategoryModule } from 'apps/api/src/category/category.module';

@Module({
  imports: [TypeOrmModule.forFeature([Stuff]), CategoryModule],
  controllers: [StuffController],
  providers: [StuffService],
})
export class StuffModule {}
