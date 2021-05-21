import { ApiHideProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class CreateCollectDto {
  @ApiHideProperty()
  collector: number;

  @IsOptional()
  @ApiHideProperty()
  article?: number;

  @IsOptional()
  @ApiHideProperty()
  product?: number;
}
