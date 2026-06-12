import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AppConfig } from '../../src/types/app-config.js';
import { runDailyPush } from '../../src/services/daily-runner.service.js';

const OFFICIAL_COMMANDS_MARKDOWN = `| \`/verify\` | **[Skill](/en/skills#bundled-skills).** Confirm a code change does what it should by building your project's app and observing the result. |`;

function createConfig(dataDir: string): AppConfig {
  return {
    app: {
      env: 'test',
      timezone: 'Asia/Shanghai',
      dataDir,
    },
    scheduler: {
      enabled: true,
      cronExpression: '5 9 * * *',
    },
    selection: {
      daysToAvoidRepeat: 14,
      avoidSameCategoryDays: 2,
      dailyCount: 1,
    },
    channels: {
      feishu: {
        enabled: false,
        webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/test',
        botSecret: undefined,
        requiredKeyword: undefined,
      },
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('runDailyPush', () => {
  it('supports dry-run using official source data without writing history', async () => {
    const dataDir = await mkdtemp(path.join(os.tmpdir(), 'daily-skill-pusher-'));
    await writeFile(
      path.join(dataDir, 'skills.json'),
      JSON.stringify([
        {
          name: 'verify',
          title: '效果验证助手',
          description: 'desc',
          category: ['quality'],
          tags: ['verify'],
          difficulty: 'easy',
          recommendScore: 90,
          universalityScore: 90,
          scenes: ['a', 'b'],
          example: '/verify',
          whyRecommended: 'good',
          relatedSkills: [],
          status: 'active'
        }
      ]),
    );
    await writeFile(path.join(dataDir, 'push-history.json'), '[]');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => OFFICIAL_COMMANDS_MARKDOWN,
      }),
    );

    const result = await runDailyPush(createConfig(dataDir), {
      dryRun: true,
      now: new Date('2026-06-11T09:00:00.000Z'),
    });

    const historyRaw = await readFile(path.join(dataDir, 'push-history.json'), 'utf8');

    expect(result.selectedSkill).toBe('verify');
    expect(result.pushResult.success).toBe(true);
    expect(result.content).toContain('效果验证助手');
    expect(JSON.parse(historyRaw)).toEqual([]);
  });

  it('skips webhook sending when feishu is disabled', async () => {
    const dataDir = await mkdtemp(path.join(os.tmpdir(), 'daily-skill-pusher-'));
    await writeFile(path.join(dataDir, 'skills.json'), '[]');
    await writeFile(path.join(dataDir, 'push-history.json'), '[]');

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await runDailyPush(createConfig(dataDir), {
      now: new Date('2026-06-11T09:00:00.000Z'),
    });

    const historyRaw = await readFile(path.join(dataDir, 'push-history.json'), 'utf8');
    const history = JSON.parse(historyRaw) as Array<{ skillName: string; status: string }>;

    expect(result.pushResult.success).toBe(true);
    expect(result.skipped).toBe(true);
    expect(result.pushResult.responseBody).toEqual({ message: 'Feishu robot push is disabled.' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(history).toHaveLength(0);
  });
});
