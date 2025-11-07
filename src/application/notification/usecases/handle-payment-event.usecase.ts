import { SendNotificationUseCase } from './send-notification.usecase';
import { Logger } from '../../../shared/logging/logger';

export class HandlePaymentEventUseCase {
  constructor(private readonly sendNotification: SendNotificationUseCase) {}

  async execute(event: any): Promise<void> {
    const { eventType, data } = event;

    switch (eventType) {
      case 'payment.success':
        await this.handlePaymentSuccess(data);
        break;
      case 'payment.failed':
        await this.handlePaymentFailed(data);
        break;
      default:
        Logger.debug('Unhandled payment event type', undefined, { eventType });
    }
  }

  private async handlePaymentSuccess(data: any): Promise<void> {
    if (data.riderId) {
      await this.sendNotification.execute({
        recipient: data.riderId,
        channel: 'email',
        subject: 'Payment Receipt',
        message: this.generatePaymentReceipt(data),
      });
    }
  }

  private async handlePaymentFailed(data: any): Promise<void> {
    if (data.riderId) {
      await this.sendNotification.execute({
        recipient: data.riderId,
        channel: 'sms',
        subject: 'Payment Failed',
        message: `Payment for trip ${data.tripId} failed. Please update your payment method.`,
      });
    }
  }

  private generatePaymentReceipt(data: any): string {
    return `
Payment Receipt
===============
Transaction ID: ${data.transactionId || 'N/A'}
Trip ID: ${data.tripId || 'N/A'}
Amount: $${data.amount || 0}
Status: Paid
Date: ${new Date().toLocaleDateString()}

Thank you for your payment!
    `.trim();
  }
}

