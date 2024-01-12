import { Inject, Injectable } from '@nestjs/common';
import { IFirebaseFireStoreService } from 'utils/firebase';
import { PrismaService } from 'utils/prisma';
import BPromise from 'bluebird';
import { CreateCommentDto, GetCommentsDto } from '../resources/dto';
import {
  CommentFirebaseResponse,
  CommentResponse,
} from '../resources/response';
import { UserCourseRole } from '@prisma/client';
import { NotificationTemplate } from '../resources/event';
import { UserResponse } from 'guards';

export const ICommentService = 'ICommentService';
export interface ICommentService {
  getComments(getCommentDto: GetCommentsDto): Promise<CommentResponse[]>;
  createComment(
    user: UserResponse,
    courseId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentResponse>;
}

@Injectable()
export class CommentService implements ICommentService {
  constructor(
    @Inject(IFirebaseFireStoreService)
    private readonly _fireStore: IFirebaseFireStoreService,
    protected readonly _prismaService: PrismaService,
  ) {}

  async getComments(getCommentDto: GetCommentsDto): Promise<CommentResponse[]> {
    const comments = await this._fireStore.get<CommentFirebaseResponse>(
      'comments',
      {
        where: {
          gradeReviewId: {
            eq: getCommentDto.gradeReviewId,
          },
        },
      },
    );

    const userComments = await BPromise.map(comments, async (comment) => {
      const user = await this._prismaService.user.findUnique({
        where: {
          id: comment.senderId,
        },
        select: {
          picture: true,
          name: true,
        },
      });

      return {
        senderName: user.name,
        avatar: user.picture || '',
        ...comment,
      };
    });

    return userComments;
  }

  async createComment(
    user: UserResponse,
    courseId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentResponse> {
    // add comments
    const comment = await this._fireStore.create('comments', {
      senderId: user.userId,
      ...createCommentDto,
    });

    // recipients
    const requesterId = await this._prismaService.gradeReview.findUnique({
      where: {
        id: createCommentDto.gradeReviewId,
      },
      select: {
        userId: true,
      },
    });

    const teacherIds = await this._prismaService.userCourse.findMany({
      where: {
        courseId,
        role: {
          in: [UserCourseRole.HOST, UserCourseRole.TEACHER],
        },
      },
      select: {
        userId: true,
      },
    });

    const recipientIds = [...teacherIds, requesterId]
      .filter((teacher) => teacher.userId !== user.userId)
      .map((recipient) => recipient.userId);

    // notification
    const event: NotificationTemplate = {
      senderId: user.userId,
      recipientIds: recipientIds,
      content: `The grade composition has mark as finalized`,
      type: 'message',
      redirectEndpoint: `/review/${createCommentDto.gradeReviewId}`,
      status: 'processing',
      title: 'New comment in grade review',
      isPublished: false,
      isRead: false,
    };

    await this._fireStore.create('notifications', event);

    return {
      ...comment,
      avatar: user.picture,
      senderName: user.name,
      recipientIds,
    };
  }
}
