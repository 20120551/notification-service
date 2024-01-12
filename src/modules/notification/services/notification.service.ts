import { Inject, Injectable } from '@nestjs/common';
import { IFirebaseFireStoreService } from 'utils/firebase';
import { NotificationResponse, UserTokenResponse } from '../resources/response';
import { UpsertNotificationDto, UpsertUserTokenDto } from '../resources/dto';
import { isEmpty } from 'lodash';
import { PrismaService } from 'utils/prisma';
import BPromise from 'bluebird';

export const INotificationService = 'INotificationService';
export interface INotificationService {
  getNotifications(userId: string): Promise<NotificationResponse[]>;
  getUserToken(userId: string): Promise<UserTokenResponse[]>;
  upsertUserToken(
    userId: string,
    data: UpsertUserTokenDto,
  ): Promise<UserTokenResponse>;
  markAsRead(
    notifications: UpsertNotificationDto[],
  ): Promise<NotificationResponse[]>;
}

@Injectable()
export class NotificationService implements INotificationService {
  constructor(
    @Inject(IFirebaseFireStoreService)
    private readonly _fireStore: IFirebaseFireStoreService,
    protected readonly _prismaService: PrismaService,
  ) {}

  async markAsRead(
    notifications: UpsertNotificationDto[],
  ): Promise<NotificationResponse[]> {
    const resp = await BPromise.map(notifications, async (notification) => {
      const res = await this._fireStore.update<
        UpsertNotificationDto,
        NotificationResponse
      >(
        'notifications',
        { isRead: notification.isRead },
        {
          where: {
            id: {
              eq: notification.notificationId,
            },
          },
        },
      );
      return res[0];
    });

    return resp;
  }

  async upsertUserToken(
    userId: string,
    data: UpsertUserTokenDto,
  ): Promise<UserTokenResponse> {
    const userToken = await this.getUserToken(userId);
    let resp = null;
    if (isEmpty(userToken)) {
      resp = await this._fireStore.create<UserTokenResponse>('user_token', {
        userId,
        token: data.token,
      });
    } else {
      resp = await this._fireStore.update<
        UpsertUserTokenDto & { userId: string },
        UserTokenResponse
      >(
        'user_token',
        { token: data.token, userId },
        {
          where: {
            userId: {
              eq: userId,
            },
          },
        },
      );
    }

    return resp;
  }

  async getNotifications(userId: string): Promise<NotificationResponse[]> {
    const notifications = await this._fireStore.get<NotificationResponse>(
      'notifications',
      {
        where: {
          recipientIds: {
            'array-contains': userId,
          },
        },
      },
    );

    const resp = await BPromise.map(notifications, async (notification) => {
      const user = await this._prismaService.user.findUnique({
        where: {
          id: notification.senderId,
        },
        select: {
          picture: true,
        },
      });

      return {
        ...notification,
        avatar: user?.picture || '',
      };
    });

    return resp;
  }

  async getUserToken(userId: string): Promise<UserTokenResponse[]> {
    const user = await this._fireStore.get<UserTokenResponse>('user_token', {
      where: {
        userId: {
          eq: userId,
        },
      },
    });

    return user;
  }
}
