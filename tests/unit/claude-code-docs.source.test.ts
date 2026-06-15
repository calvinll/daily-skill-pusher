import { afterEach, describe, expect, it, vi } from 'vitest';

import { CHANGELOG_DOC_URL, fetchOfficialClaudeCodeSkills } from '../../src/sources/claude-code-docs.source.js';

const OFFICIAL_COMMANDS_MARKDOWN = `| \`/batch <instruction>\` | **[Skill](/en/skills#bundled-skills).** Orchestrate large-scale changes across a codebase in parallel. |
| \`/code-review [low|medium|high]\` | **[Skill](/en/skills#bundled-skills).** Review the current diff for correctness bugs and cleanups. |
| \`/reload-skills\` | Re-scan [skill](/en/skills) and command directories so skills added or changed on disk during the session become available without restarting. |
| \`/run-skill-generator\` | **[Skill](/en/skills#bundled-skills).** Teach /run and /verify how to build, launch, and drive your project's app from a clean environment by writing a per-project skill. |
| \`/fewer-permission-prompts\` | **[Skill](/en/skills#bundled-skills).** Scan your transcripts for common read-only Bash and MCP tool calls, then add a prioritized allowlist to project .claude/settings.json to reduce permission prompts. |
| \`/doctor\` | Diagnose install issues. |`;
const DOCS_INDEX = `- [Week 22](https://code.claude.com/docs/en/whats-new/2026-w22.md)`;
const CHANGELOG_MARKDOWN = `\n<Update label="2.1.176" description="June 12, 2026">\nAdded \`/reload-skills\` and improved \`/code-review\`.\n</Update>`;
const WEEKLY_MARKDOWN = `# Week 22\nThis week we highlighted \`/reload-skills\`.`;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchOfficialClaudeCodeSkills', () => {
  it('extracts official bundled skills from commands markdown', async () => {
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

    const skills = await fetchOfficialClaudeCodeSkills();
    const reloadSkills = skills.find((skill) => skill.name === 'reload-skills');

    expect(skills.map((skill) => skill.name)).toEqual(['batch', 'code-review', 'reload-skills', 'run-skill-generator', 'fewer-permission-prompts']);
    expect(skills[0]?.docsUrl).toContain('/commands.md');
    expect(reloadSkills?.officialSignals.some((signal) => signal.url === CHANGELOG_DOC_URL)).toBe(true);
    expect(reloadSkills?.officialSignals.some((signal) => signal.signal === 'noteworthy')).toBe(true);
  });
});
