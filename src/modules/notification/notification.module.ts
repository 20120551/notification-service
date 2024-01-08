import { Module } from '@nestjs/common';
import { NotificationController } from './controllers';
import { INotificationService, NotificationService } from './services';

@Module({
  controllers: [NotificationController],
  providers: [
    {
      provide: INotificationService,
      useClass: NotificationService,
    },
  ],
})
export class NotificationModule {}
