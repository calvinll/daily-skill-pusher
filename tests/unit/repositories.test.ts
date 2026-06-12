import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { SkillRepository } from '../../src/repositories/skill.repository.js';
import { COMMANDS_DOC_URL } from '../../src/sources/claude-code-docs.source.js';

const OFFICIAL_COMMANDS_MARKDOWN = `| \`/code-review [low|medium|high]\` | **[Skill](/en/skills#bundled-skills).** Review the current diff for correctness bugs and cleanups. |
| \`/verify\` | **[Skill](/en/skills#bundled-skills).** Confirm a code change does what it should by building your project's app and observing the result. |
| \`/loop [interval] [prompt]\` | **[Skill](/en/skills#bundled-skills).** Run a prompt repeatedly while the session stays open. |`;

async function createTempDataDir(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'daily-skill-pusher-'));
  await mkdir(root, { recursive: true });
  return root;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SkillRepository', () => {
  it('merges official skill source with local enrichment', async () => {
    const dataDir = await createTempDataDir();
    await writeFile(
      path.join(dataDir, 'skills.json'),
      JSON.stringify([
        {
          name: 'verify',
          title: '效果验证助手',
          description: '帮助确认修改后的功能是否真的按预期工作。',
          category: ['quality', 'verification'],
          tags: ['verification'],
          difficulty: 'easy',
          recommendScore: 90,
          universalityScore: 90,
          scenes: ['改完功能后做一次手动验证', '提交前确认 bug 已修复'],
          example: '/verify',
          whyRecommended: '适合和 review 搭配。',
          links: [
            {
              label: '项目补充说明',
              url: 'https://github.com/calvinll/daily-skill-pusher/blob/main/docs/skills/verify.md'
            }
          ],
          relatedSkills: ['code-review'],
          status: 'active'
        }
      ]),
    );

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => OFFICIAL_COMMANDS_MARKDOWN,
      }),
    );

    const repository = new SkillRepository(dataDir);
    const skills = await repository.getActive();

    expect(skills).toHaveLength(3);
    const verify = skills.find((skill) => skill.name === 'verify');
    const loop = skills.find((skill) => skill.name === 'loop');

    expect(verify?.title).toBe('效果验证助手');
    expect(verify?.links[0]?.url).toBe(COMMANDS_DOC_URL);
    expect(verify?.links[1]?.label).toBe('项目补充说明');
    expect(verify?.example).toBe('/verify');

    expect(loop?.example).toBe('/loop 5m check if the deploy finished');
    expect(loop?.whyRecommended).toContain('持续盯着');
    expect(loop?.scenes).toContain('想定时检查某件事有没有变化');
  });
});
