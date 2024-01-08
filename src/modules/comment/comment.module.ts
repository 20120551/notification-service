import { Module } from '@nestjs/common';
import { CommentGateway } from './gateways';
import {
  CommentService,
  ICommentService,
  IJwtService,
  JwtService,
} from './services';

@Module({
  providers: [
    CommentGateway,
    {
      provide: IJwtService,
      useClass: JwtService,
    },
    {
      provide: ICommentService,
      useClass: CommentService,
    },
  ],
})
export class CommentModule {}
