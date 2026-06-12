import type { AppConfig } from '../types/app-config.js';
import { logger } from '../utils/logger.js';
import { runDailyPush, type RunDailyPushOptions, type RunDailyPushResult } from './daily-runner.service.js';

export async function pushDailySkill(
  config: AppConfig,
  options: RunDailyPushOptions = {},
): Promise<RunDailyPushResult> {
  const result = await runDailyPush(config, options);

  if (result.skipped) {
    logger.info('Daily push skipped', { reason: 'already-pushed-today' });
    return result;
  }

  if (!result.pushResult.success) {
    logger.error('Daily push failed', {
      skill: result.selectedSkill,
      dryRun: options.dryRun ?? false,
      errorMessage: result.pushResult.errorMessage,
    });
    return result;
  }

  logger.info('Daily push finished', {
    skill: result.selectedSkill,
    success: result.pushResult.success,
    dryRun: options.dryRun ?? false,
  });

  return result;
}
