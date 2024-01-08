import { Module } from '@nestjs/common';
import { CommentGateway } from './gateways';
import { IJwtService, JwtService } from './services';

@Module({
  providers: [
    CommentGateway,
    {
      provide: IJwtService,
      useClass: JwtService,
    },
  ],
})
export class CommentModule {}
