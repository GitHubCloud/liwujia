import { PartialType } from '@nestjs/swagger';
import { CreateCollectDto } from './create-collect.dto';

export class UpdateCollectDto extends PartialType(CreateCollectDto) {}
