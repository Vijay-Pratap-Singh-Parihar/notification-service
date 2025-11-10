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
      case 'driver.updated':
        await this.handleDriverUpdated(data);
        break;
      default:
        Logger.debug('Unhandled driver event type', undefined, { eventType });
    }
  }

  private async handleDriverRegistered(data: any): Promise<void> {
    if (data?.driver_id) {
      await this.sendNotification.execute({
        recipient: data.driver_id,
        channel: 'email',
        subject: 'Welcome to the Platform',
        message: `Welcome ${data.name}! Your driver account has been successfully registered.`,
      });
    }
  }

  private async handleDriverStatusChanged(data: any): Promise<void> {
    if (data?.driver_id) {
      const status = data.is_active ? 'active' : 'inactive';
      await this.sendNotification.execute({
        recipient: data.driver_id,
        channel: 'push',
        subject: 'Status Changed',
        message: `Your driver status has been changed to ${status}.`,
      });
    }
  }

  private async handleDriverUpdated(data: any): Promise<void> {
    if (!data?.driver_id) {
      return;
    }

    const changes = data?.changes && typeof data.changes === 'object' ? data.changes : {};
    const changeEntries = Object.entries(changes).map(([key, value]) => {
      if (value === undefined || value === null) {
        return `${key}: null`;
      }
      if (typeof value === 'object') {
        return `${key}: ${JSON.stringify(value)}`;
      }
      return `${key}: ${value}`;
    });

    const changeSummary = changeEntries.length > 0 ? changeEntries.join(', ') : 'profile details';

    await this.sendNotification.execute({
      recipient: data.driver_id,
      channel: 'push',
      subject: 'Profile Updated',
      message: `Your driver profile was updated. Latest updates: ${changeSummary}.`,
    });
  }
}

