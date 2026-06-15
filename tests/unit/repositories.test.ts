import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { SkillRepository } from '../../src/repositories/skill.repository.js';
import { CHANGELOG_DOC_URL, COMMANDS_DOC_URL } from '../../src/sources/claude-code-docs.source.js';

const OFFICIAL_COMMANDS_MARKDOWN = `| \`/code-review [low|medium|high]\` | **[Skill](/en/skills#bundled-skills).** Review the current diff for correctness bugs and cleanups. |
| \`/verify\` | **[Skill](/en/skills#bundled-skills).** Confirm a code change does what it should by building your project's app and observing the result. |
| \`/loop [interval] [prompt]\` | **[Skill](/en/skills#bundled-skills).** Run a prompt repeatedly while the session stays open. |
| \`/batch <instruction>\` | **[Skill](/en/skills#bundled-skills).** Orchestrate large-scale changes across a codebase in parallel. |
| \`/simplify\` | **[Skill](/en/skills#bundled-skills).** Review the changed code for cleanup opportunities and apply the fixes. |
| \`/reload-skills\` | Re-scan [skill](/en/skills) and command directories so skills added or changed on disk during the session become available without restarting. |
| \`/run-skill-generator\` | **[Skill](/en/skills#bundled-skills).** Teach /run and /verify how to build, launch, and drive your project's app from a clean environment by writing a per-project skill. |
| \`/fewer-permission-prompts\` | **[Skill](/en/skills#bundled-skills).** Scan your transcripts for common read-only Bash and MCP tool calls, then add a prioritized allowlist to project .claude/settings.json to reduce permission prompts. |`;
const DOCS_INDEX = `- [Week 22](https://code.claude.com/docs/en/whats-new/2026-w22.md)`;
const CHANGELOG_MARKDOWN = `Added \`/reload-skills\` and improved \`/code-review\`.`;
const WEEKLY_MARKDOWN = `Week 22 highlights include \`/reload-skills\`.`;

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
      vi.fn(async (input: string | URL | RequestInfo) => {
        const url = String(input);
        if (url.includes('commands.md')) return { ok: true, text: async () => OFFICIAL_COMMANDS_MARKDOWN };
        if (url.includes('llms.txt')) return { ok: true, text: async () => DOCS_INDEX };
        if (url.includes('changelog.md')) return { ok: true, text: async () => CHANGELOG_MARKDOWN };
        if (url.includes('2026-w22.md')) return { ok: true, text: async () => WEEKLY_MARKDOWN };
        throw new Error(`Unexpected URL ${url}`);
      }),
    );

    const repository = new SkillRepository(dataDir);
    const skills = await repository.getActive();

    expect(skills).toHaveLength(8);
    const verify = skills.find((skill) => skill.name === 'verify');
    const loop = skills.find((skill) => skill.name === 'loop');
    const batch = skills.find((skill) => skill.name === 'batch');
    const simplify = skills.find((skill) => skill.name === 'simplify');
    const reloadSkills = skills.find((skill) => skill.name === 'reload-skills');
    const runSkillGenerator = skills.find((skill) => skill.name === 'run-skill-generator');
    const fewerPermissionPrompts = skills.find((skill) => skill.name === 'fewer-permission-prompts');

    expect(verify?.title).toBe('效果验证助手');
    expect(verify?.links[0]?.url).toBe(COMMANDS_DOC_URL);
    expect(verify?.links[1]?.label).toBe('项目补充说明');
    expect(verify?.example).toBe('/verify');
    expect(verify?.themes).toContain('high-frequency-productivity');
    expect(verify?.themes).toContain('learning-path');

    expect(loop?.example).toBe('/loop 5m check if the deploy finished');
    expect(loop?.whyRecommended).toContain('持续盯着');
    expect(loop?.scenes).toContain('想定时检查某件事有没有变化');

    expect(batch?.example).toContain('/batch');
    expect(batch?.whyRecommended).toContain('并行');
    expect(batch?.themes).toContain('team-collaboration');
    expect(simplify?.whyRecommended).toContain('更干净');
    expect(reloadSkills?.example).toBe('/reload-skills');
    expect(reloadSkills?.whyRecommended).toContain('分发流程');
    expect(reloadSkills?.officialSignalScore).toBeGreaterThan(0);
    expect(reloadSkills?.officialSignals.some((signal) => signal.url === CHANGELOG_DOC_URL)).toBe(true);
    expect(reloadSkills?.isOfficialRecent).toBe(true);
    expect(reloadSkills?.isOfficialNoteworthy).toBe(true);
    expect(runSkillGenerator?.example).toBe('/run-skill-generator');
    expect(runSkillGenerator?.whyRecommended).toContain('运行流程');
    expect(fewerPermissionPrompts?.example).toBe('/fewer-permission-prompts');
    expect(fewerPermissionPrompts?.whyRecommended).toContain('权限确认');
  });
});
