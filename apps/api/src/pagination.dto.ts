import { ApiHideProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { IPaginationMeta } from 'nestjs-typeorm-paginate';

export class PaginationDto {
  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 10;

  @ApiHideProperty()
  query?: any;
}

export class CustomPaginationMeta implements IPaginationMeta {
  public readonly itemCount: number;
  public readonly totalItems: number;
  public readonly itemsPerPage: number;
  public readonly totalPages: number;
  public readonly currentPage: number;
  public readonly extraData: any;

  constructor(meta: IPaginationMeta, extra: any) {
    this.itemCount = meta.itemCount;
    this.totalItems = meta.totalItems;
    this.itemsPerPage = meta.itemsPerPage;
    this.totalPages = meta.totalPages;
    this.currentPage = meta.currentPage;
    this.extraData = extra;
  }
}
