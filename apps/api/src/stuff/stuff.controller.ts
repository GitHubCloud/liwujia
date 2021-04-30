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

@ApiTags('Stuff')
@Controller('stuff')
@UseInterceptors(ClassSerializerInterceptor)
export class StuffController {
  constructor(private readonly stuffService: StuffService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(
    @Req() req,
    @Body() createStuffDto: CreateStuffDto,
  ): Promise<Stuff> {
    createStuffDto.owner = req.user.id;

    return await this.stuffService.create(createStuffDto);
  }

  @Get()
  async paginate(
    @Query('category') category: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<Pagination<Stuff>> {
    paginationDto.query = { category };

    return this.stuffService.paginate(paginationDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Stuff> {
    return await this.stuffService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: number,
    @Body() updateStuffDto: UpdateStuffDto,
  ) {
    return await this.stuffService.update(id, updateStuffDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: number) {
    return await this.stuffService.remove(id);
  }
}
