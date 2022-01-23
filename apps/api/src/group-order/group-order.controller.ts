import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Query,
  Put,
} from '@nestjs/common';
import { GroupOrderService } from './group-order.service';
import { CreateGroupOrderDto } from './dto/create-group-order.dto';
import { UpdateGroupOrderDto } from './dto/update-group-order.dto';
import { GroupOrder, GroupOrderStatus } from './entities/group-order.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../pagination.dto';
import { Pagination } from 'nestjs-typeorm-paginate';
import { CreateCommentDto } from '../comment/dto/create-comment.dto';
import { CommonService, sceneEnum } from '../common/common.service';
import { CommentService } from '../comment/comment.service';
import { Comment } from '../comment/entities/comment.entity';
import { Like } from 'typeorm';

@ApiTags('GroupOrder')
@Controller('group-order')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(AuthGuard('jwt'))
export class GroupOrderController {
  constructor(
    private readonly groupOrderService: GroupOrderService,
    private readonly commentService: CommentService,
    private readonly commonService: CommonService,
  ) {}

  @Post()
  async create(
    @Req() req,
    @Body() createGroupOrderDto: CreateGroupOrderDto,
  ): Promise<GroupOrder> {
    createGroupOrderDto.initiator = req.user.id;

    return this.groupOrderService.create(createGroupOrderDto);
  }

  @Get()
  async paginate(
    @Req() req,
    @Query() paginationDto: PaginationDto,
    @Query('status') status: GroupOrderStatus,
    @Query('involved') involved: boolean,
    @Query('search') search: string,
  ): Promise<Pagination<GroupOrder>> {
    paginationDto.query = { status: status || GroupOrderStatus.INIT };
    if (search) paginationDto.query['title'] = Like(`%${search}%`);

    return this.groupOrderService.paginate(paginationDto, involved, req.user);
  }

  @Get(':id')
  async findOne(@Req() req, @Param('id') id: number): Promise<GroupOrder> {
    return this.groupOrderService.findOne(id);
  }

  @Put(':id')
  async update(
    @Req() req,
    @Param('id') id: number,
    @Body() updateGroupOrderDto: UpdateGroupOrderDto,
  ) {
    return await this.groupOrderService.update(
      id,
      updateGroupOrderDto,
      req.user,
    );
  }

  @Post('/:id/comment')
  async createComment(
    @Req() req,
    @Param('id') id: number,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    createCommentDto.groupOrder = id;
    createCommentDto.author = req.user.id;

    await this.commonService.WechatMessageSecurityCheck(sceneEnum.评论, {
      content: createCommentDto.content,
    });

    return this.commentService.create(createCommentDto);
  }

  @Get('/:id/comment')
  async paginateComment(
    @Param('id') id: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<Pagination<Comment>> {
    paginationDto.query = {
      groupOrder: id,
      replyTo: null,
    };

    return await this.commentService.paginate(paginationDto);
  }

  @Post('/:id/join')
  async join(@Req() req, @Param('id') id: number) {
    return this.groupOrderService.join(id, req.user);
  }

  @Delete('/:id/cancel')
  async cancel(@Req() req, @Param('id') id: number) {
    return this.groupOrderService.cancel(id, req.user);
  }

  @Delete('/:id/:uid')
  async kick(@Param('id') id: number, @Param('uid') uid: number, @Req() req) {
    return this.groupOrderService.kick(id, uid, req.user);
  }

  @Put('/:id/start')
  async start(@Req() req, @Param('id') id: number) {
    return this.groupOrderService.start(id, req.user);
  }
}
