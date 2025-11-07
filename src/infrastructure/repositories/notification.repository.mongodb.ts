import { Notification } from '../../domain/notification/notification.entity';
import { NotificationRepositoryPort } from '../../domain/notification/notification.repository.port';
import { NotificationModel } from '../database/notification.schema';

export class NotificationRepositoryMongoDB implements NotificationRepositoryPort {
  async save(notification: Notification): Promise<void> {
    await NotificationModel.findOneAndUpdate(
      { id: notification.id },
      {
        id: notification.id,
        recipient: notification.recipient,
        channel: notification.channel,
        subject: notification.subject,
        message: notification.message,
        status: notification.status,
        createdAt: notification.createdAt,
      },
      { upsert: true, new: true }
    );
  }

  async findById(id: string): Promise<Notification | null> {
    const doc = await NotificationModel.findOne({ id });
    if (!doc) return null;
    return {
      id: doc.id,
      recipient: doc.recipient,
      channel: doc.channel as 'email' | 'sms' | 'push',
      subject: doc.subject,
      message: doc.message,
      createdAt: doc.createdAt,
      status: doc.status as 'queued' | 'sent' | 'failed',
    };
  }

  async findByRecipient(recipient: string, limit = 50): Promise<Notification[]> {
    const docs = await NotificationModel.find({ recipient })
      .sort({ createdAt: -1 })
      .limit(limit);
    return docs.map((doc) => ({
      id: doc.id,
      recipient: doc.recipient,
      channel: doc.channel as 'email' | 'sms' | 'push',
      subject: doc.subject,
      message: doc.message,
      createdAt: doc.createdAt,
      status: doc.status as 'queued' | 'sent' | 'failed',
    }));
  }

  async findAll(limit = 100): Promise<Notification[]> {
    const docs = await NotificationModel.find()
      .sort({ createdAt: -1 })
      .limit(limit);
    return docs.map((doc) => ({
      id: doc.id,
      recipient: doc.recipient,
      channel: doc.channel as 'email' | 'sms' | 'push',
      subject: doc.subject,
      message: doc.message,
      createdAt: doc.createdAt,
      status: doc.status as 'queued' | 'sent' | 'failed',
    }));
  }
}

