import { PartialType } from '@nestjs/swagger';
import { CreateGroupOrderDto } from './create-group-order.dto';

export class UpdateGroupOrderDto extends PartialType(CreateGroupOrderDto) {}
