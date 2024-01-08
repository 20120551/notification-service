import { SetMetadata } from '@nestjs/common';
import { UserCourseRole } from '@prisma/client';
import { COURSE_ROLES_KEY } from 'configurations/role.config';

export type UserProviderSupport = 'google-oauth2' | 'facebook' | 'auth0';
export interface UserUserIdentity {
  userId: string;
  provider: UserProviderSupport;
  connection: string;
  isSocial: boolean;
}

export interface UserMetadata {
  [index: string]: unknown;
}
export interface UserAppMetadata {
  [index: string]: unknown;
}

export interface UserResponse {
  email: string;
  emailVerified: boolean;
  identities: UserUserIdentity;
  name: string;
  nickname: string;
  picture: string;
  userId: string;
  userMetadata: UserMetadata;
  appMetadata: UserAppMetadata;
}

export const CourseRoles = (...roles: any[]) =>
  SetMetadata(COURSE_ROLES_KEY, roles);

export interface UseCourseRoleOptions {
  roles?: UserCourseRole[];
}

export interface CourseResponse {
  courseId: string;
}

export * from './authenticated.guard';
export * from './course.role.guard';
export * from './authenticated.socket.guard';
export * from './course.role.socket.guard';
