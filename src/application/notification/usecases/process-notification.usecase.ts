import { Notification } from '../../../domain/notification/notification.entity';
import { NotificationRepositoryPort } from '../../../domain/notification/notification.repository.port';
import { NotificationChannelFactory } from '../../../infrastructure/notification-channels/notification-channel.service';
import { Logger } from '../../../shared/logging/logger';

export class ProcessNotificationUseCase {
  constructor(private readonly repository: NotificationRepositoryPort) {}

  async execute(notification: Notification): Promise<void> {
    try {
      const service = NotificationChannelFactory.getService(notification.channel);
      const success = await service.send(notification);

      if (success) {
        notification.status = 'sent';
        Logger.info('Notification sent successfully', undefined, {
          notificationId: notification.id,
          channel: notification.channel,
          recipient: notification.recipient,
        });
      } else {
        notification.status = 'failed';
        Logger.error('Notification failed to send', undefined, {
          notificationId: notification.id,
          channel: notification.channel,
          recipient: notification.recipient,
        });
      }

      await this.repository.save(notification);
    } catch (error) {
      notification.status = 'failed';
      await this.repository.save(notification);
      Logger.error('Error processing notification', undefined, {
        notificationId: notification.id,
        error: String(error),
      });
      throw error;
    }
  }
}

