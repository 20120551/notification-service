import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { INotificationService } from '../services';
import { AuthenticatedGuard, UserResponse } from 'guards';
import { User } from 'utils/decorator/parameters';
import { UpsertNotificationDto, UpsertUserTokenDto } from '../resources/dto';

@UseGuards(AuthenticatedGuard)
@Controller('/api/notification')
export class NotificationController {
  constructor(
    @Inject(INotificationService)
    private readonly _notificationService: INotificationService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Get('token')
  async getUserToken(@User() user: UserResponse) {
    const resp = await this._notificationService.getUserToken(user.userId);
    return resp;
  }

  @HttpCode(HttpStatus.OK)
  @Post('token')
  async upsertUserToken(
    @User() user: UserResponse,
    @Body() body: UpsertUserTokenDto,
  ) {
    const resp = await this._notificationService.upsertUserToken(
      user.userId,
      body,
    );

    return resp;
  }

  @HttpCode(HttpStatus.OK)
  @Get('notifications')
  async getUserNotification(@User() user: UserResponse) {
    const resp = await this._notificationService.getNotifications(user.userId);
    return resp;
  }

  @HttpCode(HttpStatus.OK)
  @Put('notifications')
  async maskAsRead(@Body() notification: UpsertNotificationDto[]) {
    const resp = await this._notificationService.markAsRead(notification);
    return resp;
  }
}
