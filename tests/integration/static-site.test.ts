import { mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildStaticSite } from '../../src/server/static-site.service.js';
import { createAppConfig } from '../../src/config/app-config.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('buildStaticSite', () => {
  it('writes dist-web artifacts for GitHub Pages', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'daily-skill-pusher-pages-'));
    await writeFile(path.join(root, 'skills.json'), '[]');
    await writeFile(path.join(root, 'push-history.json'), '[]');

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | RequestInfo) => {
        const url = String(input);
        if (url.includes('commands.md')) {
          return { ok: true, text: async () => '| `/run` | **[Skill](/en/skills#bundled-skills).** Launch and drive your project\'s app to see a change working. |' };
        }
        if (url.includes('llms.txt') || url.includes('changelog.md')) {
          return { ok: true, text: async () => '' };
        }
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
      DATA_DIR: root,
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

    const distDir = await buildStaticSite(config);
    const files = await readdir(distDir);
    const todayJson = await readFile(path.join(distDir, 'data', 'today.json'), 'utf8');
    const indexHtml = await readFile(path.join(distDir, 'index.html'), 'utf8');
    const appJs = await readFile(path.join(distDir, 'assets', 'app.js'), 'utf8');

    expect(files).toContain('index.html');
    expect(files).toContain('assets');
    expect(indexHtml).toContain('./assets/app.css');
    expect(indexHtml).toContain('./history.html');
    expect(appJs).toContain("withBasePath('/data/today.json')");
    expect(JSON.parse(todayJson).selectedSkill.name).toBe('run');
  });
});
