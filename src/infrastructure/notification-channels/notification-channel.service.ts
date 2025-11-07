import { Notification, NotificationChannel } from '../../domain/notification/notification.entity';
import { Logger } from '../../shared/logging/logger';

export interface NotificationChannelService {
  send(notification: Notification): Promise<boolean>;
}

export class EmailNotificationService implements NotificationChannelService {
  async send(notification: Notification): Promise<boolean> {
    // Mock implementation - in production, integrate with email service (SendGrid, SES, etc.)
    Logger.info('Sending email notification', undefined, {
      notificationId: notification.id,
      recipient: notification.recipient,
      subject: notification.subject,
    });
    // Simulate async email sending
    await new Promise((resolve) => setTimeout(resolve, 100));
    return true;
  }
}

export class SMSNotificationService implements NotificationChannelService {
  async send(notification: Notification): Promise<boolean> {
    // Mock implementation - in production, integrate with SMS service (Twilio, AWS SNS, etc.)
    Logger.info('Sending SMS notification', undefined, {
      notificationId: notification.id,
      recipient: notification.recipient,
    });
    // Simulate async SMS sending
    await new Promise((resolve) => setTimeout(resolve, 100));
    return true;
  }
}

export class PushNotificationService implements NotificationChannelService {
  async send(notification: Notification): Promise<boolean> {
    // Mock implementation - in production, integrate with push notification service (FCM, APNS, etc.)
    Logger.info('Sending push notification', undefined, {
      notificationId: notification.id,
      recipient: notification.recipient,
    });
    // Simulate async push notification
    await new Promise((resolve) => setTimeout(resolve, 100));
    return true;
  }
}

export class NotificationChannelFactory {
  private static emailService = new EmailNotificationService();
  private static smsService = new SMSNotificationService();
  private static pushService = new PushNotificationService();

  static getService(channel: NotificationChannel): NotificationChannelService {
    switch (channel) {
      case 'email':
        return this.emailService;
      case 'sms':
        return this.smsService;
      case 'push':
        return this.pushService;
      default:
        throw new Error(`Unsupported notification channel: ${channel}`);
    }
  }
}

