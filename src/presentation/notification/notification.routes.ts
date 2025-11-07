import { Router } from 'express';
import { NotificationController } from './notification.controller';

export function createNotificationRoutes(controller: NotificationController) {
  const router = Router();
  router.post('/', controller.send);
  router.get('/', controller.list);
  router.get('/:id', controller.get);
  router.get('/recipient/:recipientId', controller.getByRecipient);
  return router;
}

