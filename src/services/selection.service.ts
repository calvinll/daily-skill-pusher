import { REPEAT_WINDOW_FALLBACK_DIVISOR } from '../constants/selection.js';
import type { SelectionConfig } from '../types/app-config.js';
import type { PushRecord } from '../types/push-record.js';
import type { Skill } from '../types/skill.js';
import { isWithinDays } from '../utils/date.js';
import { scoreSkill, type ScoredSkill } from './scoring.service.js';

const THEME_ROTATION = [
  'high-frequency-productivity',
  'setup-workflow',
  'official-high-value',
  'team-collaboration',
  'learning-path',
] as const;

function hasRepeatedCategory(
  skill: Skill,
  skills: Skill[],
  records: PushRecord[],
  now: Date,
  days: number,
): boolean {
  if (days <= 0) {
    return false;
  }

  const skillMap = new Map(skills.map((item) => [item.name, item]));
  const recentRecords = records.filter(
    (record) => record.status === 'success' && isWithinDays(record.createdAt, now, days),
  );

  return recentRecords.some((record) => {
    const recentSkill = skillMap.get(record.skillName);
    if (!recentSkill) {
      return false;
    }

    return recentSkill.category.some((category) => skill.category.includes(category));
  });
}

function wasRecentlyPushed(skill: Skill, records: PushRecord[], now: Date, days: number): boolean {
  return records.some(
    (record) =>
      record.skillName === skill.name &&
      record.status === 'success' &&
      isWithinDays(record.createdAt, now, days),
  );
}

function buildCandidates(skills: Skill[], records: PushRecord[], now: Date, config: SelectionConfig): Skill[] {
  return skills.filter((skill) => {
    if (wasRecentlyPushed(skill, records, now, config.daysToAvoidRepeat)) {
      return false;
    }

    if (hasRepeatedCategory(skill, skills, records, now, config.avoidSameCategoryDays)) {
      return false;
    }

    return true;
  });
}

function fallbackCandidates(skills: Skill[], records: PushRecord[], now: Date, config: SelectionConfig): Skill[] {
  const fallbackWindow = Math.floor(config.daysToAvoidRepeat / REPEAT_WINDOW_FALLBACK_DIVISOR);

  return skills.filter((skill) => !wasRecentlyPushed(skill, records, now, fallbackWindow));
}

function getLatestSuccessfulTheme(records: PushRecord[], skillMap: Map<string, Skill>): string | undefined {
  const latestRecord = records
    .filter((record) => record.status === 'success')
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

  if (!latestRecord) {
    return undefined;
  }

  if (latestRecord.selectedTheme) {
    return latestRecord.selectedTheme;
  }

  return skillMap.get(latestRecord.skillName)?.themes[0];
}

function choosePreferredTheme(skills: Skill[], records: PushRecord[]): string | undefined {
  const skillMap = new Map(skills.map((skill) => [skill.name, skill]));
  const candidateThemes = new Set(skills.flatMap((skill) => skill.themes));
  const latestTheme = getLatestSuccessfulTheme(records, skillMap);

  const lastUsedByTheme = new Map<string, string>();
  const successfulRecords = records
    .filter((record) => record.status === 'success')
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  for (const record of successfulRecords) {
    const theme = record.selectedTheme ?? skillMap.get(record.skillName)?.themes[0];
    if (theme && !lastUsedByTheme.has(theme)) {
      lastUsedByTheme.set(theme, record.createdAt);
    }
  }

  const orderedThemes = THEME_ROTATION.filter((theme) => candidateThemes.has(theme)).sort((left, right) => {
    if (left === latestTheme) return 1;
    if (right === latestTheme) return -1;

    const leftLastUsed = lastUsedByTheme.get(left);
    const rightLastUsed = lastUsedByTheme.get(right);
    if (!leftLastUsed && !rightLastUsed) return 0;
    if (!leftLastUsed) return -1;
    if (!rightLastUsed) return 1;
    return leftLastUsed.localeCompare(rightLastUsed);
  });

  return orderedThemes[0];
}

export function selectDailySkill(
  skills: Skill[],
  records: PushRecord[],
  now: Date,
  config: SelectionConfig,
): ScoredSkill {
  const candidates = buildCandidates(skills, records, now, config);
  const finalCandidates = candidates.length > 0 ? candidates : fallbackCandidates(skills, records, now, config);

  if (finalCandidates.length === 0) {
    throw new Error('No eligible skills available for today.');
  }

  const preferredTheme = choosePreferredTheme(finalCandidates, records);
  const themedCandidates = preferredTheme
    ? finalCandidates.filter((skill) => skill.themes.includes(preferredTheme))
    : finalCandidates;
  const rankingPool = themedCandidates.length > 0 ? themedCandidates : finalCandidates;

  const scored = rankingPool
    .map((skill) => ({ ...scoreSkill(skill, skills, records, now), selectedTheme: preferredTheme }))
    .sort((left, right) => right.score - left.score);

  return scored[0]!;
}
