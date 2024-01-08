import { Inject, Injectable } from '@nestjs/common';
import { IFirebaseFireStoreService } from 'utils/firebase';
import { PrismaService } from 'utils/prisma';
import BPromise from 'bluebird';
import { CreateCommentDto, GetCommentsDto } from '../resources/dto';
import { CommentResponse } from '../resources/response';

export const ICommentService = 'ICommentService';
export interface ICommentService {
  getComments(
    courseId: string,
    getCommentDto: GetCommentsDto,
  ): Promise<CommentResponse>;
  createComment(
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

  getComments(
    courseId: string,
    getCommentDto: GetCommentsDto,
  ): Promise<CommentResponse> {
    throw new Error('Method not implemented.');
  }

  createComment(
    courseId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentResponse> {
    throw new Error('Method not implemented.');
  }
}
