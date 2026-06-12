import { z } from 'zod';

const optionalNonEmptyString = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  },
  z.string().min(1).optional(),
);

export const envSchema = z.object({
  APP_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_TIMEZONE: z.string().min(1).default('Asia/Shanghai'),
  CRON_EXPRESSION: z.string().min(1).default('5 9 * * *'),
  FEISHU_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  FEISHU_WEBHOOK_URL: z
    .string()
    .url()
    .default('https://open.feishu.cn/open-apis/bot/v2/hook/replace-me'),
  FEISHU_BOT_SECRET: optionalNonEmptyString,
  FEISHU_REQUIRED_KEYWORD: optionalNonEmptyString,
  DATA_DIR: z.string().min(1).default('./data'),
  DAYS_TO_AVOID_REPEAT: z.coerce.number().int().min(0).default(14),
  AVOID_SAME_CATEGORY_DAYS: z.coerce.number().int().min(0).default(2),
  DAILY_COUNT: z.coerce.number().int().min(1).max(1).default(1),
  SCHEDULER_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  GITHUB_ACTIONS: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;
