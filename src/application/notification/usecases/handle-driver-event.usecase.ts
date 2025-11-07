import { SendNotificationUseCase } from './send-notification.usecase';
import { Logger } from '../../../shared/logging/logger';

export class HandleDriverEventUseCase {
  constructor(private readonly sendNotification: SendNotificationUseCase) {}

  async execute(event: any): Promise<void> {
    const { eventType, data } = event;

    switch (eventType) {
      case 'driver.registered':
        await this.handleDriverRegistered(data);
        break;
      case 'driver.status.changed':
        await this.handleDriverStatusChanged(data);
        break;
      default:
        Logger.debug('Unhandled driver event type', undefined, { eventType });
    }
  }

  private async handleDriverRegistered(data: any): Promise<void> {
    if (data.id) {
      await this.sendNotification.execute({
        recipient: data.id,
        channel: 'email',
        subject: 'Welcome to the Platform',
        message: `Welcome ${data.name}! Your driver account has been successfully registered.`,
      });
    }
  }

  private async handleDriverStatusChanged(data: any): Promise<void> {
    if (data.id) {
      const status = data.isActive ? 'active' : 'inactive';
      await this.sendNotification.execute({
        recipient: data.id,
        channel: 'push',
        subject: 'Status Changed',
        message: `Your driver status has been changed to ${status}.`,
      });
    }
  }
}

