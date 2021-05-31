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

@WebSocketGateway()
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly jwtService: JwtService) {}

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('WebSocketGateway');

  handleConnection(client: Socket, ...args: any) {
    const token = client.handshake.headers.authorization.split(' ')[1];
    const user = this.jwtService.verify(token);

    client.emit('welcome', `Welcome ${user.nickname}.`);
    this.logger.log(`Client connected: ${client.id}`);
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
    console.log({ data });
    if (!data) return false;

    await socket.leave(data);
    return data;
  }
}
