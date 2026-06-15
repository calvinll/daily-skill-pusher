import { z } from 'zod';

const weekdayThemeSchema = z.enum([
  'high-frequency-productivity',
  'setup-workflow',
  'official-high-value',
  'team-collaboration',
  'learning-path',
]);

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
  WEB_PORT: z.coerce.number().int().min(1).default(4173),
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
  WEEKDAY_THEME_MONDAY: weekdayThemeSchema.default('high-frequency-productivity'),
  WEEKDAY_THEME_TUESDAY: weekdayThemeSchema.default('setup-workflow'),
  WEEKDAY_THEME_WEDNESDAY: weekdayThemeSchema.default('official-high-value'),
  WEEKDAY_THEME_THURSDAY: weekdayThemeSchema.default('team-collaboration'),
  WEEKDAY_THEME_FRIDAY: weekdayThemeSchema.default('learning-path'),
  SCHEDULER_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  GITHUB_ACTIONS: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;
