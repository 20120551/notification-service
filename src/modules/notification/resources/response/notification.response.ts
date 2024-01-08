export interface NotificationResponse {
  senderId: string;
  content: string;
  channel: string;
  type: string;
  redirectEndpoint: string;
  isPublished: boolean;
  name: string;
  avatar: string;
}

export interface UserTokenResponse {
  token: string;
  userId?: string;
}
