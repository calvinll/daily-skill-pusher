import { describe, expect, it } from 'vitest';

import { createAppConfig } from '../../src/config/app-config.js';

describe('createAppConfig', () => {
  it('respects FEISHU_ENABLED=false', () => {
    const config = createAppConfig({
      APP_ENV: 'development',
      APP_TIMEZONE: 'Asia/Shanghai',
      CRON_EXPRESSION: '5 9 * * *',
      FEISHU_ENABLED: false,
      FEISHU_WEBHOOK_URL: 'https://open.feishu.cn/open-apis/bot/v2/hook/test',
      FEISHU_BOT_SECRET: undefined,
      FEISHU_REQUIRED_KEYWORD: undefined,
      DATA_DIR: './data',
      DAYS_TO_AVOID_REPEAT: 14,
      AVOID_SAME_CATEGORY_DAYS: 2,
      DAILY_COUNT: 1,
      SCHEDULER_ENABLED: true,
      GITHUB_ACTIONS: undefined,
    });

    expect(config.channels.feishu.enabled).toBe(false);
  });
});
