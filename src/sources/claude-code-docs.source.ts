const COMMANDS_DOC_URL = 'https://code.claude.com/docs/en/commands.md';

export type OfficialSkillSeed = {
  name: string;
  title: string;
  description: string;
  docsUrl: string;
};

function cleanDescription(value: string): string {
  return value
    .replace(/\{\/\*.*?\*\/\}/g, '')
    .replace(/\*\*\[Skill\]\([^)]*\)\.\*\*/g, '')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSkillRow(line: string): OfficialSkillSeed | null {
  const match = line.match(/^\|\s*`([^`]+)`\s*\|\s*(.+?)\s*\|$/);
  if (!match) {
    return null;
  }

  const commandSpec = match[1]?.trim();
  const descriptionCell = match[2]?.trim() ?? '';
  if (!commandSpec?.startsWith('/')) {
    return null;
  }

  const isSkillRow = descriptionCell.includes('[Skill]');
  const isSpecialReloadSkills = commandSpec.startsWith('/reload-skills');
  if (!isSkillRow && !isSpecialReloadSkills) {
    return null;
  }

  const nameMatch = commandSpec.match(/^\/([a-z0-9-]+)/i);
  const name = nameMatch?.[1];
  if (!name) {
    return null;
  }

  return {
    name,
    title: `/${name}`,
    description: cleanDescription(descriptionCell),
    docsUrl: COMMANDS_DOC_URL,
  };
}

export async function fetchOfficialClaudeCodeSkills(): Promise<OfficialSkillSeed[]> {
  const response = await fetch(COMMANDS_DOC_URL, {
    headers: {
      'user-agent': 'daily-skill-pusher/0.1.0',
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch official Claude Code commands docs: ${response.status}`);
  }

  const markdown = await response.text();
  const skills = markdown
    .split('\n')
    .map((line) => parseSkillRow(line))
    .filter((item): item is OfficialSkillSeed => item !== null);

  const deduped = new Map<string, OfficialSkillSeed>();
  for (const skill of skills) {
    deduped.set(skill.name, skill);
  }

  return Array.from(deduped.values());
}

export { COMMANDS_DOC_URL };
