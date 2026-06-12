import type { PushPayload } from '../types/channel.js';
import type { Skill } from '../types/skill.js';
import { renderDailySkillCard, renderDailySkillPreview } from '../templates/daily-skill.template.js';

export function createDailySkillContent(skill: Skill): PushPayload {
  const title = `🧠 今日精选 Skill：${skill.title}`;

  return {
    title,
    previewText: renderDailySkillPreview(skill),
    feishuCard: renderDailySkillCard(skill, title),
  };
}
