import cron from 'node-cron';

import type { AppConfig } from '../types/app-config.js';
import { logger } from '../utils/logger.js';
import { pushDailySkill } from '../services/push.service.js';

export function startCronScheduler(config: AppConfig): void {
  if (!config.scheduler.enabled) {
    logger.warn('Scheduler is disabled by configuration.');
    return;
  }

  if (!config.channels.feishu.enabled) {
    logger.warn('Feishu robot push is disabled by configuration.');
    return;
  }

  logger.info('Starting scheduler', {
    cron: config.scheduler.cronExpression,
    timezone: config.app.timezone,
  });

  cron.schedule(
    config.scheduler.cronExpression,
    async () => {
      try {
        await pushDailySkill(config);
      } catch (error) {
        logger.error('Scheduled push failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    {
      timezone: config.app.timezone,
    },
  );
}
