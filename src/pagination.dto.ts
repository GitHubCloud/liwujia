import { ApiHideProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 10;

  @ApiHideProperty()
  query?: any;
}
