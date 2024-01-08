import { Inject, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { AuthenticatedSocketGuard } from 'guards/authenticated.socket.guard';
import { Server, Socket } from 'socket.io';
import { IJwtService } from '../services';
import { UnauthorizedException } from 'utils/errors/domain.error';
import { UseSocketCoursePolicies } from 'guards';
import { UserCourseRole } from '@prisma/client';
import { GET_COMMENTS } from '../resources/constant';
import { GetCommentsDto } from '../resources/dto';

@UseGuards(AuthenticatedSocketGuard)
@WebSocketGateway(8000)
export class CommentGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @Inject(IJwtService)
    private readonly _jwtService: IJwtService,
  ) {}
  private readonly _clients = new Map<string, string>(); // socketId -> UserId

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket, ...args: any[]) {
    if (!client.handshake.headers.authorization) {
      throw new UnauthorizedException('Not found token in header');
    }

    const token = client.handshake.headers.authorization.split(' ')[1];
    const user = await this._jwtService.verify(token);

    this._clients.set(client.id, user.userId);
    console.log('connected', client.id);
  }

  @UseGuards(AuthenticatedSocketGuard)
  @UseSocketCoursePolicies({
    roles: [UserCourseRole.HOST, UserCourseRole.TEACHER],
  })
  @SubscribeMessage(GET_COMMENTS)
  handleMessage(
    @MessageBody() data: GetCommentsDto,
    @ConnectedSocket() client: Socket,
  ) {
    // Handle received message
    console.log(data);
    this.server.to(this._clients.keys()[0]).emit('message1', data);
    // this.server.emit('message1', data); // Broadcast the message to all connected clients
  }

  handleDisconnect(client: Socket) {
    console.log('disconnected...');
    this._clients.delete(client.id);
  }
}
