import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Req,
  Put,
} from '@nestjs/common';
import { StuffService } from './stuff.service';
import { CreateStuffDto } from './dto/create-stuff.dto';
import { UpdateStuffDto } from './dto/update-stuff.dto';
import { Stuff } from './entities/stuff.entity';
import { PaginationDto } from 'apps/api/src/pagination.dto';
import { Pagination } from 'nestjs-typeorm-paginate';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { StuffColor } from './stuffColor.enum';

@ApiTags('Stuff')
@Controller('stuff')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(AuthGuard('jwt'))
export class StuffController {
  constructor(private readonly stuffService: StuffService) { }

  @Post()
  async create(
    @Req() req,
    @Body() createStuffDto: CreateStuffDto,
  ): Promise<Stuff> {
    createStuffDto.owner = req.user.id;

    return await this.stuffService.create(createStuffDto);
  }

  @Get()
  async paginate(
    @Req() req,
    @Query('category') category: number,
    @Query('color') color: StuffColor,
    @Query() paginationDto: PaginationDto,
  ): Promise<Pagination<Stuff>> {
    paginationDto.query = { owner: req.user.id };
    if (category) paginationDto.query['category'] = category;

    return this.stuffService.paginate(paginationDto, color);
  }

  @Get('calendar')
  async calendar(@Req() req, @Query('date') date: string) {
    return this.stuffService.calendar(date, req.user);
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Stuff> {
    return await this.stuffService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateStuffDto: UpdateStuffDto,
  ) {
    return await this.stuffService.update(id, updateStuffDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return await this.stuffService.remove(id);
  }
}
