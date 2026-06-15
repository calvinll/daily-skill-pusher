import path from 'node:path';

import type { AppConfig } from '../types/app-config.js';
import type { EnvConfig } from './schema.js';

export function createAppConfig(env: EnvConfig, cwd: string = process.cwd()): AppConfig {
  return {
    app: {
      env: env.APP_ENV,
      timezone: env.APP_TIMEZONE,
      dataDir: path.resolve(cwd, env.DATA_DIR),
    },
    scheduler: {
      enabled: env.SCHEDULER_ENABLED,
      cronExpression: env.CRON_EXPRESSION,
    },
    selection: {
      daysToAvoidRepeat: env.DAYS_TO_AVOID_REPEAT,
      avoidSameCategoryDays: env.AVOID_SAME_CATEGORY_DAYS,
      dailyCount: env.DAILY_COUNT,
      weekdayThemes: {
        monday: env.WEEKDAY_THEME_MONDAY,
        tuesday: env.WEEKDAY_THEME_TUESDAY,
        wednesday: env.WEEKDAY_THEME_WEDNESDAY,
        thursday: env.WEEKDAY_THEME_THURSDAY,
        friday: env.WEEKDAY_THEME_FRIDAY,
      },
    },
    channels: {
      feishu: {
        enabled: env.FEISHU_ENABLED,
        webhookUrl: env.FEISHU_WEBHOOK_URL,
        botSecret: env.FEISHU_BOT_SECRET,
        requiredKeyword: env.FEISHU_REQUIRED_KEYWORD,
      },
    },
  };
}
