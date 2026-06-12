import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AppConfig } from '../../src/types/app-config.js';
import { runDailyPush } from '../../src/services/daily-runner.service.js';

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
  it('supports dry-run without writing history', async () => {
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
          links: [{ label: '技能文档', url: 'https://github.com/calvinll/daily-skill-pusher/blob/main/docs/skills/verify.md' }],
          relatedSkills: [],
          status: 'active',
          pushCount: 0,
          lastPushedAt: null
        }
      ]),
    );
    await writeFile(path.join(dataDir, 'push-history.json'), '[]');

    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = await runDailyPush(createConfig(dataDir), {
      dryRun: true,
      now: new Date('2026-06-11T09:00:00.000Z'),
    });

    const historyRaw = await readFile(path.join(dataDir, 'push-history.json'), 'utf8');

    expect(result.selectedSkill).toBe('verify');
    expect(result.pushResult.success).toBe(true);
    expect(result.content).toContain('效果验证助手');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(JSON.parse(historyRaw)).toEqual([]);
  });

  it('skips webhook sending when feishu is disabled', async () => {
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
          links: [{ label: '技能文档', url: 'https://github.com/calvinll/daily-skill-pusher/blob/main/docs/skills/verify.md' }],
          relatedSkills: [],
          status: 'active',
          pushCount: 0,
          lastPushedAt: null
        }
      ]),
    );
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
