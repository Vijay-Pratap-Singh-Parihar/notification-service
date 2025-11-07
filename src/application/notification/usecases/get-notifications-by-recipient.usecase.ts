import { NotificationRepositoryPort } from '../../../domain/notification/notification.repository.port';
import { Notification } from '../../../domain/notification/notification.entity';

export class GetNotificationsByRecipientUseCase {
  constructor(private readonly repository: NotificationRepositoryPort) {}

  async execute(recipient: string, limit = 50): Promise<Notification[]> {
    if (this.repository.findByRecipient) {
      return await this.repository.findByRecipient(recipient, limit);
    }
    // Fallback if repository doesn't support findByRecipient
    const all = this.repository.findAll ? await this.repository.findAll(limit * 2) : [];
    return all.filter((n) => n.recipient === recipient).slice(0, limit);
  }
}

