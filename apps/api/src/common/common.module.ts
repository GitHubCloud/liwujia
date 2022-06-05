import { forwardRef, HttpModule, Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { CommonService } from './common.service';

@Module({
  imports: [HttpModule, forwardRef(() => UserModule)],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
