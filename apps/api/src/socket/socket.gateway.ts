import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import * as _ from 'lodash';

@WebSocketGateway()
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly jwtService: JwtService) {}

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('WebSocketGateway');

  handleConnection(client: Socket, ...args: any) {
    try {
      const token: string = _.last(
        _.get(client, 'handshake.headers.authorization', '').split(' '),
      );
      const user = this.jwtService.verify(token);

      client.emit('welcome', `Welcome ${user.nickname}.`);
      this.logger.log(`Client connected: ${client.id}`);
    } catch (e) {
      this.logger.error(e);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // join room
  @UseGuards(AuthGuard('wsJwt'))
  @SubscribeMessage('join') // 收发消息
  async handleJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: any,
  ) {
    if (!data) return false;

    // TODO: 判断是否有权加入该房间

    await socket.join(data);
    return data;
  }

  // leave room
  @UseGuards(AuthGuard('wsJwt'))
  @SubscribeMessage('leave') // 收发消息
  async handleLeave(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: any,
  ) {
    if (!data) return false;

    await socket.leave(data);
    return data;
  }
}
