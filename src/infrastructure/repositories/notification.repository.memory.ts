import { Notification } from '../../domain/notification/notification.entity';
import { NotificationRepositoryPort } from '../../domain/notification/notification.repository.port';

export class InMemoryNotificationRepository implements NotificationRepositoryPort {
  private readonly store = new Map<string, Notification>();

  async save(notification: Notification): Promise<void> {
    this.store.set(notification.id, notification);
  }

  async findById(id: string): Promise<Notification | null> {
    return this.store.get(id) ?? null;
  }
}


