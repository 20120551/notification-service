import { INestApplication } from '@nestjs/common';
import {
  IFirebaseFireStoreService,
  IFirebaseMessageService,
} from 'utils/firebase';
import BPromise from 'bluebird';
import { GradeStructureFinalizedEvent } from './events';
import { DocumentData } from 'firebase-admin/firestore';
import { isEmpty } from 'lodash';
import { UserTokenResponse } from 'modules/notification/resources/response';
import { PrismaService } from 'utils/prisma';

const subscriber = async (app: INestApplication) => {
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
        async (event: GradeStructureFinalizedEvent & { id: string }) => {
          const { recipientIds, isPublished, ...payload } = event;
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
            tokens.map(({ token }) => token),
            {
              notification: {
                title: event.name,
                body: event.content,
                // redirectEndpoint: event.redirectEndpoint,
              },
              data: {
                ...payload,
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
};

export default subscriber;
