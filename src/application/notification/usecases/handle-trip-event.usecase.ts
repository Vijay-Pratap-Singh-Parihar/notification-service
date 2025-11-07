import { SendNotificationUseCase } from './send-notification.usecase';
import { Logger } from '../../../shared/logging/logger';

export class HandleTripEventUseCase {
  constructor(private readonly sendNotification: SendNotificationUseCase) {}

  async execute(event: any): Promise<void> {
    const { eventType, data } = event;

    switch (eventType) {
      case 'trip.completed':
        await this.handleTripCompleted(data);
        break;
      case 'trip.accepted':
        await this.handleTripAccepted(data);
        break;
      case 'trip.cancelled':
        await this.handleTripCancelled(data);
        break;
      default:
        Logger.debug('Unhandled trip event type', undefined, { eventType });
    }
  }

  private async handleTripCompleted(data: any): Promise<void> {
    // Send invoice/ride summary to rider
    if (data.riderId) {
      await this.sendNotification.execute({
        recipient: data.riderId,
        channel: 'email',
        subject: 'Trip Completed - Invoice',
        message: this.generateTripCompletedMessage(data),
      });
    }

    // Notify driver
    if (data.driverId) {
      await this.sendNotification.execute({
        recipient: data.driverId,
        channel: 'push',
        subject: 'Trip Completed',
        message: `Trip ${data.tripId} completed. Fare: $${data.fare || 0}`,
      });
    }
  }

  private async handleTripAccepted(data: any): Promise<void> {
    // Notify rider
    if (data.riderId) {
      await this.sendNotification.execute({
        recipient: data.riderId,
        channel: 'push',
        subject: 'Driver Assigned',
        message: `Your ride has been accepted. Driver is on the way!`,
      });
    }
  }

  private async handleTripCancelled(data: any): Promise<void> {
    // Notify rider
    if (data.riderId) {
      await this.sendNotification.execute({
        recipient: data.riderId,
        channel: 'sms',
        subject: 'Trip Cancelled',
        message: `Your trip ${data.tripId} has been cancelled.`,
      });
    }
  }

  private generateTripCompletedMessage(data: any): string {
    return `
Ride Summary
============
Trip ID: ${data.tripId || 'N/A'}
Date: ${new Date().toLocaleDateString()}
Distance: ${data.distance || 'N/A'} km
Fare: $${data.fare || 0}
${data.surge ? `Surge Multiplier: ${data.surge}x` : ''}

Thank you for using our service!
    `.trim();
  }
}

