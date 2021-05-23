import { ApiHideProperty } from '@nestjs/swagger';
import { IsExistsInTable } from '../../custom.decorator';
import { Product } from '../../product/entities/product.entity';
import { User } from '../../user/entities/user.entity';
import { OrderStatus } from '../orderStatus.enum';

export class CreateOrderDto {
  @IsExistsInTable('product', 'id', { message: '闲置不存在' })
  product: Product;

  @ApiHideProperty()
  seller: User;

  @ApiHideProperty()
  buyer: User;

  @ApiHideProperty()
  status: OrderStatus;
}
