import { REPEAT_WINDOW_FALLBACK_DIVISOR } from '../constants/selection.js';
import type { SelectionConfig } from '../types/app-config.js';
import type { PushRecord } from '../types/push-record.js';
import type { Skill } from '../types/skill.js';
import { isWithinDays } from '../utils/date.js';
import { scoreSkill, type ScoredSkill } from './scoring.service.js';

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

  const scored = finalCandidates
    .map((skill) => scoreSkill(skill, skills, records, now))
    .sort((left, right) => right.score - left.score);

  return scored[0]!;
}
