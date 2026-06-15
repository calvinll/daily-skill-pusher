import { DEFAULT_FRESHNESS_SCORE, MAX_FRESHNESS_SCORE } from '../constants/selection.js';
import type { PushRecord } from '../types/push-record.js';
import type { Skill } from '../types/skill.js';
import { diffDays } from '../utils/date.js';

const RELATED_SKILL_BOOST = 8;
const OFFICIAL_BUNDLED_BOOST = 4;
const MAX_OFFICIAL_SIGNAL_BOOST = 8;
const DIFFICULTY_BONUS: Record<Skill['difficulty'], number> = {
  easy: 4,
  medium: 2,
  hard: -3,
};

export type ScoredSkill = {
  skill: Skill;
  score: number;
  selectedTheme?: string;
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

function getLatestSuccessfulRecord(records: PushRecord[]): PushRecord | undefined {
  return records
    .filter((record) => record.status === 'success')
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
}

function getDiversityScore(skill: Skill, records: PushRecord[]): number {
  const latestRecord = getLatestSuccessfulRecord(records);

  if (!latestRecord) {
    return 100;
  }

  return latestRecord.skillName === skill.name ? 10 : 85;
}

function getRelatedSkillBoost(skill: Skill, skillMap: Map<string, Skill>, records: PushRecord[]): number {
  const latestRecord = getLatestSuccessfulRecord(records);
  if (!latestRecord) {
    return 0;
  }

  const previousSkill = skillMap.get(latestRecord.skillName);
  if (!previousSkill) {
    return 0;
  }

  return previousSkill.relatedSkills.includes(skill.name) ? RELATED_SKILL_BOOST : 0;
}

function getOfficialBundledBoost(skill: Skill): number {
  const hasOfficialCategory = skill.category.includes('official') || skill.tags.includes('official');
  const hasBundledTag = skill.category.includes('bundled-skill') || skill.tags.includes('bundled-skill');
  return hasOfficialCategory || hasBundledTag ? OFFICIAL_BUNDLED_BOOST : 0;
}

function getDifficultyAdjustment(skill: Skill): number {
  return DIFFICULTY_BONUS[skill.difficulty];
}

function getOfficialSignalBoost(skill: Skill): number {
  return Math.min(skill.officialSignalScore, MAX_OFFICIAL_SIGNAL_BOOST);
}

export function scoreSkill(skill: Skill, skills: Skill[], records: PushRecord[], now: Date): ScoredSkill {
  const freshnessScore = getFreshnessScore(skill, records, now);
  const diversityScore = getDiversityScore(skill, records);
  const skillMap = new Map(skills.map((item) => [item.name, item]));
  const relatedSkillBoost = getRelatedSkillBoost(skill, skillMap, records);
  const officialBundledBoost = getOfficialBundledBoost(skill);
  const officialSignalBoost = getOfficialSignalBoost(skill);
  const difficultyAdjustment = getDifficultyAdjustment(skill);

  const score =
    skill.recommendScore * 0.5 +
    skill.universalityScore * 0.2 +
    freshnessScore * 0.2 +
    diversityScore * 0.1 +
    relatedSkillBoost +
    officialBundledBoost +
    officialSignalBoost +
    difficultyAdjustment;

  return {
    skill,
    score: Number(score.toFixed(2)),
  };
}
