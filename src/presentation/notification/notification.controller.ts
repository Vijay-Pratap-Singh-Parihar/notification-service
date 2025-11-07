import { Request, Response, NextFunction } from 'express';
import { SendNotificationUseCase } from '../../application/notification/usecases/send-notification.usecase';
import { GetNotificationUseCase } from '../../application/notification/usecases/get-notification.usecase';
import { GetNotificationsByRecipientUseCase } from '../../application/notification/usecases/get-notifications-by-recipient.usecase';
import { ListNotificationsUseCase } from '../../application/notification/usecases/list-notifications.usecase';
import { Logger } from '../../shared/logging/logger';

export class NotificationController {
  constructor(
    private sendNotification: SendNotificationUseCase,
    private getNotification: GetNotificationUseCase,
    private getNotificationsByRecipient: GetNotificationsByRecipientUseCase,
    private listNotifications: ListNotificationsUseCase
  ) {}

  send = async (req: Request, res: Response, next: NextFunction) => {
    const correlationId = res.locals.correlationId as string;
    try {
      const notification = await this.sendNotification.execute(req.body);
      Logger.info('Notification queued', correlationId, {
        notificationId: notification.id,
        channel: notification.channel,
        recipient: notification.recipient,
      });
      res.status(202).json(notification);
    } catch (e) {
      Logger.error('Failed to send notification', correlationId, { error: String(e) });
      next(e);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    const correlationId = res.locals.correlationId as string;
    try {
      const notification = await this.getNotification.execute(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: { message: 'Notification not found', statusCode: 404 } });
      }
      Logger.debug('Retrieved notification', correlationId, { notificationId: notification.id });
      res.json(notification);
    } catch (e) {
      Logger.error('Failed to get notification', correlationId, { error: String(e), notificationId: req.params.id });
      next(e);
    }
  };

  getByRecipient = async (req: Request, res: Response, next: NextFunction) => {
    const correlationId = res.locals.correlationId as string;
    try {
      const recipient = req.params.recipientId;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const notifications = await this.getNotificationsByRecipient.execute(recipient, limit);
      Logger.debug('Retrieved notifications by recipient', correlationId, {
        recipient,
        count: notifications.length,
      });
      res.json(notifications);
    } catch (e) {
      Logger.error('Failed to get notifications by recipient', correlationId, {
        error: String(e),
        recipient: req.params.recipientId,
      });
      next(e);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    const correlationId = res.locals.correlationId as string;
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const notifications = await this.listNotifications.execute(limit);
      Logger.debug('Listed notifications', correlationId, { count: notifications.length });
      res.json(notifications);
    } catch (e) {
      Logger.error('Failed to list notifications', correlationId, { error: String(e) });
      next(e);
    }
  };
}

