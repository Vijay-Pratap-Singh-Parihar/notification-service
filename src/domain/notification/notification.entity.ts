export type NotificationChannel = 'email' | 'sms' | 'push';

export interface Notification {
  id: string;
  recipient: string;
  channel: NotificationChannel;
  subject?: string;
  message: string;
  createdAt: Date;
  status: 'queued' | 'sent' | 'failed';
}


