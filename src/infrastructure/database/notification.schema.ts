import mongoose, { Schema, Document, Types } from 'mongoose';
import { Notification, NotificationChannel } from '../../domain/notification/notification.entity';

export interface NotificationDocument extends Document {
  _id: Types.ObjectId;
  id: string;
  recipient: string;
  channel: NotificationChannel;
  subject?: string;
  message: string;
  createdAt: Date;
  status: 'queued' | 'sent' | 'failed';
}

const NotificationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    recipient: { type: String, required: true, index: true },
    channel: { type: String, required: true, enum: ['email', 'sms', 'push'], index: true },
    subject: { type: String },
    message: { type: String, required: true },
    status: { type: String, required: true, enum: ['queued', 'sent', 'failed'], default: 'queued', index: true },
  },
  {
    timestamps: true,
    _id: true,
  }
);

// Create indexes
NotificationSchema.index({ id: 1 }, { unique: true });
NotificationSchema.index({ recipient: 1 });
NotificationSchema.index({ channel: 1 });
NotificationSchema.index({ status: 1 });
NotificationSchema.index({ createdAt: -1 });

// Convert to domain entity
NotificationSchema.methods.toDomain = function (): Notification {
  return {
    id: this.id,
    recipient: this.recipient,
    channel: this.channel as NotificationChannel,
    subject: this.subject,
    message: this.message,
    createdAt: this.createdAt,
    status: this.status as 'queued' | 'sent' | 'failed',
  };
};

const notificationCollectionName = process.env.NOTIFICATION_COLLECTION || 'notifications';
export const NotificationModel = mongoose.model<NotificationDocument>('Notification', NotificationSchema, notificationCollectionName);

