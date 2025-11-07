import express from 'express';
import { errorHandler } from './presentation/middleware/error-handler';
import { correlationIdMiddleware } from './presentation/middleware/correlation-id';
import { MongoDBConfig } from './infrastructure/database/mongodb.config';
import { NotificationRepositoryMongoDB } from './infrastructure/repositories/notification.repository.mongodb';
import { SendNotificationUseCase } from './application/notification/usecases/send-notification.usecase';
import { GetNotificationUseCase } from './application/notification/usecases/get-notification.usecase';
import { GetNotificationsByRecipientUseCase } from './application/notification/usecases/get-notifications-by-recipient.usecase';
import { ListNotificationsUseCase } from './application/notification/usecases/list-notifications.usecase';
import { ProcessNotificationUseCase } from './application/notification/usecases/process-notification.usecase';
import { HandleTripEventUseCase } from './application/notification/usecases/handle-trip-event.usecase';
import { HandlePaymentEventUseCase } from './application/notification/usecases/handle-payment-event.usecase';
import { HandleDriverEventUseCase } from './application/notification/usecases/handle-driver-event.usecase';
import { NotificationController } from './presentation/notification/notification.controller';
import { createNotificationRoutes } from './presentation/notification/notification.routes';
import { KafkaConsumerConfig } from './infrastructure/messaging/kafka-consumer.config';
import { Logger } from './shared/logging/logger';
import { createMetricsHandler, inc, METRIC_NOTIFICATIONS_QUEUED_TOTAL, METRIC_NOTIFICATIONS_SENT_TOTAL, METRIC_NOTIFICATIONS_FAILED_TOTAL } from './infrastructure/metrics/metrics';

const app = express();
app.use(express.json());
app.use(correlationIdMiddleware);

app.get('/health', (req, res) => res.status(200).json({ status: 'OK', service: 'notification-service' }));

// Initialize MongoDB connection
const mongoConfig = MongoDBConfig.getInstance();

// Initialize Kafka Consumer
const kafkaConsumer = KafkaConsumerConfig.getInstance();

// Initialize dependencies
const notificationRepository = new NotificationRepositoryMongoDB();
const sendNotificationUseCase = new SendNotificationUseCase(notificationRepository);
const getNotificationUseCase = new GetNotificationUseCase(notificationRepository);
const getNotificationsByRecipientUseCase = new GetNotificationsByRecipientUseCase(notificationRepository);
const listNotificationsUseCase = new ListNotificationsUseCase(notificationRepository);
const processNotificationUseCase = new ProcessNotificationUseCase(notificationRepository);
const handleTripEventUseCase = new HandleTripEventUseCase(sendNotificationUseCase);
const handlePaymentEventUseCase = new HandlePaymentEventUseCase(sendNotificationUseCase);
const handleDriverEventUseCase = new HandleDriverEventUseCase(sendNotificationUseCase);

const notificationController = new NotificationController(
  sendNotificationUseCase,
  getNotificationUseCase,
  getNotificationsByRecipientUseCase,
  listNotificationsUseCase
);

// Routes
app.use('/v1/notifications', createNotificationRoutes(notificationController));

// Metrics endpoint
app.get('/metrics', createMetricsHandler(notificationRepository));

app.use(errorHandler);

const PORT = process.env.PORT || 3004;

// Start server with MongoDB and Kafka connections
async function startServer() {
  try {
    await mongoConfig.connect();
    await kafkaConsumer.connect();

    // Subscribe to Kafka topics
    const topics = [
      process.env.KAFKA_TOPIC_TRIP_EVENTS || 'trip-events',
      process.env.KAFKA_TOPIC_PAYMENT_EVENTS || 'payment-events',
      process.env.KAFKA_TOPIC_DRIVER_NOTIFICATIONS || 'driver-notifications',
    ];
    await kafkaConsumer.subscribe(topics);

    // Start consuming messages
    await kafkaConsumer.run(async ({ topic, data }) => {
      try {
        if (topic.includes('trip')) {
          await handleTripEventUseCase.execute(data);
        } else if (topic.includes('payment')) {
          await handlePaymentEventUseCase.execute(data);
        } else if (topic.includes('driver')) {
          await handleDriverEventUseCase.execute(data);
        }
      } catch (error) {
        Logger.error('Error handling event', undefined, { topic, error: String(error) });
      }
    });

    // Process queued notifications in background
    setInterval(async () => {
      try {
        if (notificationRepository.findAll) {
          const all = await notificationRepository.findAll(100);
          const queued = all.filter(n => n.status === 'queued');
          for (const notification of queued.slice(0, 10)) {
            try {
              await processNotificationUseCase.execute(notification);
              if (notification.status === 'sent') {
                inc(METRIC_NOTIFICATIONS_SENT_TOTAL, 1);
              } else if (notification.status === 'failed') {
                inc(METRIC_NOTIFICATIONS_FAILED_TOTAL, 1);
              }
            } catch (error) {
              Logger.error('Error processing notification', undefined, {
                notificationId: notification.id,
                error: String(error),
              });
            }
          }
        }
      } catch (error) {
        Logger.error('Error processing queued notifications', undefined, { error: String(error) });
      }
    }, 5000); // Process every 5 seconds

    app.listen(PORT, () => {
      Logger.info(`🔔 Notification Service running on port ${PORT}`);
    });
  } catch (error) {
    Logger.error('Failed to start server', undefined, { error: String(error) });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  Logger.info('SIGTERM signal received: closing HTTP server');
  await kafkaConsumer.disconnect();
  await mongoConfig.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  Logger.info('SIGINT signal received: closing HTTP server');
  await kafkaConsumer.disconnect();
  await mongoConfig.disconnect();
  process.exit(0);
});

startServer();
