import { Request, Response } from 'express';
import { NotificationRepositoryPort } from '../../domain/notification/notification.repository.port';

// Simple in-memory counters/gauges (Prometheus text exposition)
const counters: Record<string, number> = Object.create(null);

export const METRIC_NOTIFICATIONS_SENT_TOTAL = 'notifications_sent_total';
export const METRIC_NOTIFICATIONS_FAILED_TOTAL = 'notifications_failed_total';
export const METRIC_NOTIFICATIONS_QUEUED_TOTAL = 'notifications_queued_total';
export const METRIC_NOTIFICATIONS_TOTAL = 'notifications_total';

export function inc(metric: string, by = 1) {
  counters[metric] = (counters[metric] || 0) + by;
}

export function set(metric: string, value: number) {
  counters[metric] = value;
}

export function createMetricsHandler(repo: NotificationRepositoryPort) {
  return async (_req: Request, res: Response) => {
    // derive gauges from repository
    if (repo.findAll) {
      const all = await repo.findAll(1000);
      set(METRIC_NOTIFICATIONS_TOTAL, all.length);
      const queued = all.filter(n => n.status === 'queued').length;
      const sent = all.filter(n => n.status === 'sent').length;
      const failed = all.filter(n => n.status === 'failed').length;
      set('notifications_queued_gauge', queued);
      set('notifications_sent_gauge', sent);
      set('notifications_failed_gauge', failed);
    }

    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    let body = '';
    body += `# HELP ${METRIC_NOTIFICATIONS_SENT_TOTAL} Total number of notifications sent\n`;
    body += `# TYPE ${METRIC_NOTIFICATIONS_SENT_TOTAL} counter\n`;
    body += `${METRIC_NOTIFICATIONS_SENT_TOTAL} ${counters[METRIC_NOTIFICATIONS_SENT_TOTAL] || 0}\n`;

    body += `# HELP ${METRIC_NOTIFICATIONS_FAILED_TOTAL} Total number of notifications failed\n`;
    body += `# TYPE ${METRIC_NOTIFICATIONS_FAILED_TOTAL} counter\n`;
    body += `${METRIC_NOTIFICATIONS_FAILED_TOTAL} ${counters[METRIC_NOTIFICATIONS_FAILED_TOTAL] || 0}\n`;

    body += `# HELP ${METRIC_NOTIFICATIONS_QUEUED_TOTAL} Total number of notifications queued\n`;
    body += `# TYPE ${METRIC_NOTIFICATIONS_QUEUED_TOTAL} counter\n`;
    body += `${METRIC_NOTIFICATIONS_QUEUED_TOTAL} ${counters[METRIC_NOTIFICATIONS_QUEUED_TOTAL] || 0}\n`;

    body += `# HELP ${METRIC_NOTIFICATIONS_TOTAL} Current total notifications\n`;
    body += `# TYPE ${METRIC_NOTIFICATIONS_TOTAL} gauge\n`;
    body += `${METRIC_NOTIFICATIONS_TOTAL} ${counters[METRIC_NOTIFICATIONS_TOTAL] || 0}\n`;

    res.status(200).send(body);
  };
}

