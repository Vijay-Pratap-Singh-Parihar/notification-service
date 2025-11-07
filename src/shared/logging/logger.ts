type LogLevel = 'info' | 'error' | 'warn' | 'debug';

interface LogPayload {
  level: LogLevel;
  message: string;
  correlationId?: string;
  context?: Record<string, unknown>;
}

function log(payload: LogPayload) {
  const line = {
    ts: new Date().toISOString(),
    level: payload.level,
    msg: payload.message,
    correlationId: payload.correlationId,
    ...payload.context && { context: payload.context },
  };
  // single-line JSON
  process.stdout.write(JSON.stringify(line) + '\n');
}

export const Logger = {
  info(message: string, correlationId?: string, context?: Record<string, unknown>) {
    log({ level: 'info', message, correlationId, context });
  },
  error(message: string, correlationId?: string, context?: Record<string, unknown>) {
    log({ level: 'error', message, correlationId, context });
  },
  warn(message: string, correlationId?: string, context?: Record<string, unknown>) {
    log({ level: 'warn', message, correlationId, context });
  },
  debug(message: string, correlationId?: string, context?: Record<string, unknown>) {
    log({ level: 'debug', message, correlationId, context });
  },
};

