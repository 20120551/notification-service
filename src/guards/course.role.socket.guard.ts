import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserCourseRole } from '@prisma/client';
import { COURSE_ROLES_KEY } from 'configurations/role.config';
import { CourseRoles, UseCourseRoleOptions } from 'guards';
import { Socket } from 'socket.io';
import { UnauthorizedException } from 'utils/errors/domain.error';
import { PrismaService } from 'utils/prisma';

@Injectable()
export class CourseRoleSocketGuard implements CanActivate {
  constructor(
    private readonly _prismaService: PrismaService,
    private readonly _reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToWs().getClient<Socket>();
    const { gradeReviewId } = req.data;

    if (!gradeReviewId) {
      throw new UnauthorizedException("you don't have permission");
    }
    const { userId } = req.user;

    const gradeReview = await this._prismaService.gradeReview.findUnique({
      where: {
        id: gradeReviewId,
      },
      select: {
        userId: true,
        userCourseGrade: {
          select: {
            courseId: true,
          },
        },
      },
    });

    const courseId = gradeReview?.userCourseGrade?.courseId;
    if (!courseId) {
      throw new UnauthorizedException(
        'Grade review does not associate with 1 course',
      );
    }

    const { role } = await this._prismaService.userCourse.findFirst({
      where: {
        courseId,
        userId,
      },
    });

    const allowRoles = this._reflector.getAllAndOverride<any[]>(
      COURSE_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (
      allowRoles.flat().some((_role) => _role === role) ||
      userId === gradeReview.userId
    ) {
      return true;
    }

    return false;
  }
}

export const UseSocketCoursePolicies = (
  options: UseCourseRoleOptions,
): ClassDecorator & MethodDecorator => {
  return (target: Function, prop?: string, descriptor?: PropertyDescriptor) => {
    CourseRoles(options.roles)(target, prop, descriptor);
    UseGuards(CourseRoleSocketGuard)(target, prop, descriptor);
  };
};
