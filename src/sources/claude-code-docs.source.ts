const DOCS_INDEX_URL = 'https://code.claude.com/docs/llms.txt';
const COMMANDS_DOC_URL = 'https://code.claude.com/docs/en/commands.md';
const CHANGELOG_DOC_URL = 'https://code.claude.com/docs/en/changelog.md';

export type OfficialSignal = {
  source: 'changelog' | 'whats-new';
  url: string;
  signal: 'recent' | 'noteworthy';
  weight: number;
};

export type OfficialSkillSeed = {
  name: string;
  title: string;
  description: string;
  docsUrl: string;
  officialSignals: OfficialSignal[];
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

function parseSkillRow(line: string): Omit<OfficialSkillSeed, 'officialSignals'> | null {
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

function extractCommandMentions(markdown: string): string[] {
  const matches = markdown.matchAll(/`\/([a-z0-9-]+)(?:[^`]*)`/gi);
  return Array.from(new Set(Array.from(matches, (match) => match[1]).filter(Boolean) as string[]));
}

async function fetchMarkdown(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'daily-skill-pusher/0.1.0',
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch official Claude Code docs: ${url} ${response.status}`);
  }

  return response.text();
}

function collectWeeklyUrls(indexMarkdown: string): string[] {
  const matches = indexMarkdown.matchAll(/https:\/\/code\.claude\.com\/docs\/en\/whats-new\/\d{4}-w\d{2}\.md/g);
  const urls = Array.from(new Set(Array.from(matches, (match) => match[0])));
  return urls.sort().slice(-3);
}

async function fetchOfficialSignals(): Promise<Map<string, OfficialSignal[]>> {
  const [docsIndex, changelog] = await Promise.all([
    fetchMarkdown(DOCS_INDEX_URL),
    fetchMarkdown(CHANGELOG_DOC_URL),
  ]);

  const weeklyUrls = collectWeeklyUrls(docsIndex);
  const weeklyPages = await Promise.all(weeklyUrls.map(async (url) => ({ url, markdown: await fetchMarkdown(url) })));

  const signalMap = new Map<string, OfficialSignal[]>();

  for (const commandName of extractCommandMentions(changelog)) {
    const existing = signalMap.get(commandName) ?? [];
    existing.push({
      source: 'changelog',
      url: CHANGELOG_DOC_URL,
      signal: 'recent',
      weight: 4,
    });
    signalMap.set(commandName, existing);
  }

  for (const page of weeklyPages) {
    for (const commandName of extractCommandMentions(page.markdown)) {
      const existing = signalMap.get(commandName) ?? [];
      existing.push({
        source: 'whats-new',
        url: page.url,
        signal: 'noteworthy',
        weight: 6,
      });
      signalMap.set(commandName, existing);
    }
  }

  return signalMap;
}

export async function fetchOfficialClaudeCodeSkills(): Promise<OfficialSkillSeed[]> {
  const [commandsMarkdown, signalMap] = await Promise.all([
    fetchMarkdown(COMMANDS_DOC_URL),
    fetchOfficialSignals(),
  ]);

  const skills = commandsMarkdown
    .split('\n')
    .map((line) => parseSkillRow(line))
    .filter((item): item is Omit<OfficialSkillSeed, 'officialSignals'> => item !== null)
    .map((skill) => ({
      ...skill,
      officialSignals: signalMap.get(skill.name) ?? [],
    }));

  const deduped = new Map<string, OfficialSkillSeed>();
  for (const skill of skills) {
    deduped.set(skill.name, skill);
  }

  return Array.from(deduped.values());
}

export { CHANGELOG_DOC_URL, COMMANDS_DOC_URL, DOCS_INDEX_URL };
