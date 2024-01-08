export interface CommentResponse {
  recipientIds: string[];
  content: string;
  senderId: string;
  avatar: string;
}

export interface CommentFirebaseResponse {
  content: string;
  senderId: string;
}
