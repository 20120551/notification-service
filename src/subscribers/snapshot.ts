import { INestApplication } from '@nestjs/common';
import {
  IFirebaseFireStoreService,
  IFirebaseMessageService,
} from 'utils/firebase';
import BPromise from 'bluebird';
import { DocumentData } from 'firebase-admin/firestore';
import { isEmpty } from 'lodash';
import { UserTokenResponse } from 'modules/notification/resources/response';
import { PrismaService } from 'utils/prisma';
import { NotificationTemplate } from './events';

const subscriber = async (app: INestApplication) => {
  try {
    const firestoreService = app.get<IFirebaseFireStoreService>(
      IFirebaseFireStoreService,
    );
    const messagingService = app.get<IFirebaseMessageService>(
      IFirebaseMessageService,
    );
    const prismaService = app.get<PrismaService>(PrismaService);

    console.log('subscriber');
    firestoreService.onSnapshot(
      'notifications',
      {
        where: {
          isPublished: {
            eq: false,
          },
        },
      },
      async (data: DocumentData[]) => {
        await BPromise.map(
          data,
          async (event: NotificationTemplate & { id: string }) => {
            const { recipientIds, isPublished, isRead, ...payload } = event;
            if (isEmpty(recipientIds)) {
              return;
            }

            const tokens = await firestoreService.get<UserTokenResponse>(
              'user_token',
              {
                where: {
                  userId: {
                    in: recipientIds,
                  },
                },
              },
            );

            if (isEmpty(tokens)) {
              return;
            }

            const user = await prismaService.user.findUnique({
              where: {
                id: event.senderId,
              },
              select: {
                picture: true,
              },
            });

            const results = await messagingService.sendByTokens(
              tokens.map(({ token }) => token).filter(Boolean),
              {
                notification: {
                  title: event.title,
                  body: event.content,
                },
                data: {
                  ...payload,
                  isRead: String(isRead),
                  avatar: user.picture,
                },
                type: 'webpush',
              },
            );

            console.log(results);

            await firestoreService.update(
              'notifications',
              {
                ...event,
                isPublished: true,
              },
              {
                where: {
                  id: {
                    eq: event.id,
                  },
                },
              },
            );
          },
          {
            concurrency: 5,
          },
        );
      },
      async (error: Error) => {
        console.log(error);
      },
    );
  } catch (err) {
    console.log(err);
  }
};

export default subscriber;
