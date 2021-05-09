import { ApiHideProperty } from "@nestjs/swagger";

export class CreateCollectDto {
  @ApiHideProperty()
  collector: number;

  @ApiHideProperty()
  article: number;
}
