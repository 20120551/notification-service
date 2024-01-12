import { Inject, UseFilters, UseGuards } from '@nestjs/common';
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
import { ICommentService, IJwtService } from '../services';
import { UnauthorizedException } from 'utils/errors/domain.error';
import { CourseResponse, UseSocketCoursePolicies, UserResponse } from 'guards';
import { UserCourseRole } from '@prisma/client';
import {
  COMMENT_CREATED,
  CREATE_COMMENT,
  GET_COMMENTS,
} from '../resources/constant';
import { CreateCommentDto, GetCommentsDto } from '../resources/dto';
import { Course, User } from 'utils/decorator/parameters';

@WebSocketGateway({ cors: '*' })
export class CommentGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @Inject(IJwtService)
    private readonly _jwtService: IJwtService,
    @Inject(ICommentService)
    private readonly _commentService: ICommentService,
  ) {}
  private readonly _clients = new Map<string, string>(); // UserId -> SocketId

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket, ...args: any[]) {
    const user = await this._jwtService.verify(
      client.handshake.headers.authorization,
    );

    this._clients.set(user.userId, client.id);
    console.log('connected', client.id);
  }

  @UseSocketCoursePolicies({
    roles: [UserCourseRole.HOST, UserCourseRole.TEACHER],
  })
  @UseGuards(AuthenticatedSocketGuard)
  @SubscribeMessage(GET_COMMENTS)
  async getComments(
    @MessageBody() data: GetCommentsDto,
    @ConnectedSocket() client: Socket,
  ) {
    // Handle received message
    const comments = await this._commentService.getComments(data);
    return comments;
  }

  @UseSocketCoursePolicies({
    roles: [UserCourseRole.HOST, UserCourseRole.TEACHER],
  })
  @UseGuards(AuthenticatedSocketGuard)
  @SubscribeMessage(CREATE_COMMENT)
  async createComment(
    @Course() course: CourseResponse,
    @User() user: UserResponse,
    @MessageBody() data: CreateCommentDto,
    @ConnectedSocket() client: Socket,
  ) {
    // Handle received message
    const { recipientIds, ...comment } =
      await this._commentService.createComment(user, course.courseId, data);

    // send comments
    await this.server
      .to(
        recipientIds
          .map((recipientId) => this._clients.get(recipientId))
          .filter(Boolean),
      )
      .emit(COMMENT_CREATED, comment);

    console.log('sending to ', recipientIds, 'succeed!');
    return comment;
  }

  handleDisconnect(client: Socket) {
    console.log('disconnected...');
    this._clients.delete(client.id);
  }
}
