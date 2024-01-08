import { Inject, Injectable } from '@nestjs/common';
import { FirebaseModuleOptions } from '.';
import { initializeApp } from 'firebase-admin/app';
import { credential } from 'firebase-admin';
import { Messaging, getMessaging } from 'firebase-admin/messaging';
import { credential as firebaseCredential } from './credential';

export type MessagingResponse = {
  id: string;
};
export type MuticastMessagingResponse = {
  success: number;
  failure: number;
  messageIds: string[];
};
export type MessageBody = {
  notification: {
    title: string;
    body: string;
  };
  data?: Record<string, string>;
  type: 'android' | 'apns' | 'webpush';
};

export const IFirebaseMessageService = 'IFirebaseMessageService';
export interface IFirebaseMessageService {
  sendByToken<T extends MessageBody>(
    token: string,
    message: T,
  ): Promise<MessagingResponse>;
  sendByTopic<T extends MessageBody>(
    topic: string,
    message: T,
  ): Promise<MessagingResponse>;
  sendByTokens<T extends MessageBody>(
    tokens: string[],
    message: T,
  ): Promise<MuticastMessagingResponse>;
}

@Injectable()
export class FirebaseMessageService implements IFirebaseMessageService {
  private readonly _fcm: Messaging;
  constructor(
    @Inject(FirebaseModuleOptions)
    options: FirebaseModuleOptions,
  ) {
    const app = initializeApp(
      {
        credential: credential.cert(firebaseCredential),
      },
      'messaging',
    );
    this._fcm = getMessaging(app);
  }

  async sendByTokens<T extends MessageBody>(
    tokens: string[],
    message: T,
  ): Promise<MuticastMessagingResponse> {
    const res = await this._fcm.sendEachForMulticast({
      ...this._createMessageBody(message),
      tokens,
    });

    return {
      success: res.successCount,
      failure: res.failureCount,
      messageIds: res.responses.map((res) => res.messageId),
    };
  }

  async sendByToken<T extends MessageBody>(
    token: string,
    message: T,
  ): Promise<MessagingResponse> {
    const res = await this._fcm.send({
      ...this._createMessageBody(message),
      token,
    });

    return { id: res };
  }

  async sendByTopic<T extends MessageBody>(
    topic: string,
    message: T,
  ): Promise<MessagingResponse> {
    const res = await this._fcm.send({
      ...this._createMessageBody(message),
      topic,
    });

    return { id: res };
  }

  private _createMessageBody(message: MessageBody) {
    return {
      notification: message.notification,
      data: message.data,
      // webpush: {
      //   headers: {
      //     image: 'https://foo.bar.pizza-monster.png',
      //   },
      // },
    };
  }
}
