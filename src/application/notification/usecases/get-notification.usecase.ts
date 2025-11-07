import { NotificationRepositoryPort } from '../../../domain/notification/notification.repository.port';
import { Notification } from '../../../domain/notification/notification.entity';

export class GetNotificationUseCase {
  constructor(private readonly repository: NotificationRepositoryPort) {}

  async execute(id: string): Promise<Notification | null> {
    return await this.repository.findById(id);
  }
}

