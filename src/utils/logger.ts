type LogLevel = 'info' | 'warn' | 'error';

function log(level: LogLevel, message: string, extra?: Record<string, unknown>): void {
  const payload = {
    level,
    time: new Date().toISOString(),
    message,
    ...extra,
  };

  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  info(message: string, extra?: Record<string, unknown>) {
    log('info', message, extra);
  },
  warn(message: string, extra?: Record<string, unknown>) {
    log('warn', message, extra);
  },
  error(message: string, extra?: Record<string, unknown>) {
    log('error', message, extra);
  },
};
