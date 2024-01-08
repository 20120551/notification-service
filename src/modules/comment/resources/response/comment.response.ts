export interface CommentResponse {
  id: string;
  recipientIds?: string[];
  content: string;
  senderId: string;
  senderName: string;
  avatar: string;
}

export interface CommentFirebaseResponse {
  id: string;
  content: string;
  senderId: string;
}
