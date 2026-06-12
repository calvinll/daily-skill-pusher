import { DEFAULT_FRESHNESS_SCORE, MAX_FRESHNESS_SCORE } from '../constants/selection.js';
import type { PushRecord } from '../types/push-record.js';
import type { Skill } from '../types/skill.js';
import { diffDays } from '../utils/date.js';

export type ScoredSkill = {
  skill: Skill;
  score: number;
};

function getFreshnessScore(skill: Skill, records: PushRecord[], now: Date): number {
  const latestRecord = records
    .filter((record) => record.skillName === skill.name && record.status === 'success')
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

  if (!latestRecord) {
    return MAX_FRESHNESS_SCORE;
  }

  const diff = diffDays(new Date(latestRecord.createdAt), now);
  return Math.max(DEFAULT_FRESHNESS_SCORE, Math.min(MAX_FRESHNESS_SCORE, diff * 8));
}

function getDiversityScore(skill: Skill, records: PushRecord[]): number {
  const latestRecord = records
    .filter((record) => record.status === 'success')
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

  if (!latestRecord) {
    return 100;
  }

  return latestRecord.skillName === skill.name ? 10 : 85;
}

export function scoreSkill(skill: Skill, records: PushRecord[], now: Date): ScoredSkill {
  const freshnessScore = getFreshnessScore(skill, records, now);
  const diversityScore = getDiversityScore(skill, records);

  const score =
    skill.recommendScore * 0.5 +
    skill.universalityScore * 0.2 +
    freshnessScore * 0.2 +
    diversityScore * 0.1;

  return {
    skill,
    score: Number(score.toFixed(2)),
  };
}
