import type { PushRecord } from '../types/push-record.js';
import type { Skill } from '../types/skill.js';

export type TodayViewModel = {
  selectedTheme?: string;
  selectedSkill: Skill;
  previewText: string;
};

export type HistoryItemViewModel = {
  date: string;
  skillName: string;
  title: string;
  selectedTheme?: string;
  status: PushRecord['status'];
  content: string;
};

export type SkillSummaryViewModel = {
  name: string;
  title: string;
  description: string;
  themes: string[];
  links: Skill['links'];
};

export function buildHistoryItems(records: PushRecord[], skillMap: Map<string, Skill>): HistoryItemViewModel[] {
  return [...records]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((record) => {
      const skill = skillMap.get(record.skillName);
      return {
        date: record.date,
        skillName: record.skillName,
        title: skill?.title ?? record.skillName,
        selectedTheme: record.selectedTheme,
        status: record.status,
        content: record.content,
      };
    });
}

export function buildSkillSummaries(skills: Skill[]): SkillSummaryViewModel[] {
  return skills
    .map((skill) => ({
      name: skill.name,
      title: skill.title,
      description: skill.description,
      themes: skill.themes,
      links: skill.links,
    }))
    .sort((left, right) => left.title.localeCompare(right.title));
}
