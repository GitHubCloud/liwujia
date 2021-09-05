import { HttpModule, Module } from '@nestjs/common';
import { CommonService } from './common.service';

@Module({
  imports: [HttpModule],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
