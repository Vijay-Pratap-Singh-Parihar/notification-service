import { Notification } from './notification.entity';

export interface NotificationRepositoryPort {
  save(notification: Notification): Promise<void>;
  findById(id: string): Promise<Notification | null>;
  findByRecipient?(recipient: string, limit?: number): Promise<Notification[]>;
  findAll?(limit?: number): Promise<Notification[]>;
}


