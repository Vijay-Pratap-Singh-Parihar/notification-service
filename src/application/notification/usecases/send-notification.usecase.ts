import { Notification, NotificationChannel } from '../../../domain/notification/notification.entity';
import { NotificationRepositoryPort } from '../../../domain/notification/notification.repository.port';
import { inc, METRIC_NOTIFICATIONS_QUEUED_TOTAL } from '../../../infrastructure/metrics/metrics';

export interface SendNotificationInput {
  recipient: string;
  channel: NotificationChannel;
  subject?: string;
  message: string;
}

export class SendNotificationUseCase {
  constructor(private readonly repository: NotificationRepositoryPort) {}

  async execute(input: SendNotificationInput): Promise<Notification> {
    const notification: Notification = {
      id: crypto.randomUUID(),
      recipient: input.recipient,
      channel: input.channel,
      subject: input.subject,
      message: input.message,
      createdAt: new Date(),
      status: 'queued',
    };
    await this.repository.save(notification);
    inc(METRIC_NOTIFICATIONS_QUEUED_TOTAL, 1);
    return notification;
  }
}


