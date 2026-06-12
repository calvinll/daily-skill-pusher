import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchOfficialClaudeCodeSkills } from '../../src/sources/claude-code-docs.source.js';

const OFFICIAL_COMMANDS_MARKDOWN = `| \`/batch <instruction>\` | **[Skill](/en/skills#bundled-skills).** Orchestrate large-scale changes across a codebase in parallel. |
| \`/code-review [low|medium|high]\` | **[Skill](/en/skills#bundled-skills).** Review the current diff for correctness bugs and cleanups. |
| \`/reload-skills\` | Re-scan [skill](/en/skills) and command directories so skills added or changed on disk during the session become available without restarting. |
| \`/doctor\` | Diagnose install issues. |`;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchOfficialClaudeCodeSkills', () => {
  it('extracts official bundled skills from commands markdown', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => OFFICIAL_COMMANDS_MARKDOWN,
      }),
    );

    const skills = await fetchOfficialClaudeCodeSkills();

    expect(skills.map((skill) => skill.name)).toEqual(['batch', 'code-review', 'reload-skills']);
    expect(skills[0]?.docsUrl).toContain('/commands.md');
  });
});
