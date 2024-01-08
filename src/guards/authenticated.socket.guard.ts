import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';
import { UnauthorizedException } from 'utils/errors/domain.error';
import { UserResponse } from 'guards';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Socket } from 'socket.io';

@Injectable()
export class AuthenticatedSocketGuard implements CanActivate {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly _cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToWs().getClient() as Socket;
    const token = request.handshake.headers.authorization;
    if (!token) {
      throw new UnauthorizedException('Token not appear in request header');
    }

    const accessToken = token.split(' ')[1];
    if (!accessToken) {
      throw new UnauthorizedException('Token stype not supported');
    }

    const userInfo = await this._cacheManager.get<UserResponse>(accessToken);
    if (!userInfo) {
      throw new UnauthorizedException('Invalid Token');
    }

    request.user = {
      ...userInfo,
      userId: userInfo['sub'],
      userMetadata: userInfo.appMetadata || {},
    };
    return true;
  }
}
