import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { WebApiService } from '../../src/server/web-api.service.js';
import { createAppConfig } from '../../src/config/app-config.js';

const OFFICIAL_COMMANDS_MARKDOWN = `| \`/run\` | **[Skill](/en/skills#bundled-skills).** Launch and drive your project's app to see a change working. |`;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('WebApiService', () => {
  it('returns today recommendation and skill list', async () => {
    const dataDir = await mkdtemp(path.join(os.tmpdir(), 'daily-skill-pusher-web-'));
    await writeFile(path.join(dataDir, 'skills.json'), '[]');
    await writeFile(path.join(dataDir, 'push-history.json'), '[]');

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | RequestInfo) => {
        const url = String(input);
        if (url.includes('commands.md')) return { ok: true, text: async () => OFFICIAL_COMMANDS_MARKDOWN };
        if (url.includes('llms.txt')) return { ok: true, text: async () => '' };
        if (url.includes('changelog.md')) return { ok: true, text: async () => '' };
        return { ok: true, text: async () => '' };
      }),
    );

    const config = createAppConfig({
      APP_ENV: 'test',
      APP_TIMEZONE: 'Asia/Shanghai',
      WEB_PORT: 4173,
      CRON_EXPRESSION: '5 9 * * *',
      FEISHU_ENABLED: false,
      FEISHU_WEBHOOK_URL: 'https://open.feishu.cn/open-apis/bot/v2/hook/test',
      FEISHU_BOT_SECRET: undefined,
      FEISHU_REQUIRED_KEYWORD: undefined,
      DATA_DIR: dataDir,
      DAYS_TO_AVOID_REPEAT: 14,
      AVOID_SAME_CATEGORY_DAYS: 2,
      DAILY_COUNT: 1,
      WEEKDAY_THEME_MONDAY: 'high-frequency-productivity',
      WEEKDAY_THEME_TUESDAY: 'setup-workflow',
      WEEKDAY_THEME_WEDNESDAY: 'official-high-value',
      WEEKDAY_THEME_THURSDAY: 'team-collaboration',
      WEEKDAY_THEME_FRIDAY: 'learning-path',
      SCHEDULER_ENABLED: true,
      GITHUB_ACTIONS: undefined,
    }, '/Users/bytedance/Desktop/claude-pratice/daily-skill-pusher');

    const service = new WebApiService(config);
    const today = await service.getToday();
    const skills = await service.getSkills();

    expect(today.selectedSkill.name).toBe('run');
    expect(skills.some((skill) => skill.name === 'run')).toBe(true);
  });
});
