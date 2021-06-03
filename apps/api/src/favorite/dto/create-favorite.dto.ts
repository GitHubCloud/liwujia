import { ApiHideProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class CreateFavoriteDto {
  @ApiHideProperty()
  user: number;

  @IsOptional()
  @ApiHideProperty()
  article?: number;

  @IsOptional()
  @ApiHideProperty()
  product?: number;
}
