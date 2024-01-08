import { UserResponse, CourseResponse } from 'guards';

declare module 'socket.io' {
  interface Socket {
    user?: UserResponse;
    course?: CourseResponse;
  }
}
