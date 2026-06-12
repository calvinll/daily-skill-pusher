import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { AppConfig } from '../../src/types/app-config.js';
import { HistoryRepository } from '../../src/repositories/history.repository.js';
import { SkillRepository } from '../../src/repositories/skill.repository.js';

async function createTempDataDir(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'daily-skill-pusher-'));
  await mkdir(root, { recursive: true });
  return root;
}

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
        enabled: true,
        webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/test',
      },
    },
  };
}

describe('repositories', () => {
  it('loads skill and history files', async () => {
    const dataDir = await createTempDataDir();
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

    const skillRepository = new SkillRepository(dataDir);
    const historyRepository = new HistoryRepository(createConfig(dataDir));

    const [skills, history] = await Promise.all([
      skillRepository.getActive(),
      historyRepository.getAll(),
    ]);

    expect(skills).toHaveLength(1);
    expect(history).toEqual([]);
  });
});
