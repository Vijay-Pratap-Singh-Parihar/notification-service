import { NotificationRepositoryPort } from '../../../domain/notification/notification.repository.port';
import { Notification } from '../../../domain/notification/notification.entity';

export class ListNotificationsUseCase {
  constructor(private readonly repository: NotificationRepositoryPort) {}

  async execute(limit = 100): Promise<Notification[]> {
    if (this.repository.findAll) {
      return await this.repository.findAll(limit);
    }
    return [];
  }
}

