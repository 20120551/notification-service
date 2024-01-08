import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { UserResponse } from 'guards';
import { UnauthorizedException } from 'utils/errors/domain.error';
import { Cache } from 'cache-manager';

export const IJwtService = 'IJwtService';
export interface IJwtService {
  verify(token: string): Promise<UserResponse>;
}
export class JwtService implements IJwtService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly _cacheManager: Cache,
  ) {}

  async verify(token: string): Promise<UserResponse> {
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

    return {
      ...userInfo,
      userId: userInfo['sub'],
      userMetadata: userInfo.appMetadata || {},
    };
  }
}
