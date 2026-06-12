import { describe, expect, it } from 'vitest';

import { createDailySkillContent } from '../../src/services/content.service.js';
import type { Skill } from '../../src/types/skill.js';

const skill: Skill = {
  name: 'verify',
  title: '效果验证助手',
  description: '帮助确认修改是否真的生效。',
  category: ['quality'],
  tags: ['verify'],
  difficulty: 'easy',
  recommendScore: 90,
  universalityScore: 90,
  scenes: ['场景一', '场景二'],
  example: '/verify',
  whyRecommended: '防止改了但没生效',
  links: [
    {
      label: '技能文档',
      url: 'https://github.com/calvinll/daily-skill-pusher/blob/main/docs/skills/verify.md',
    },
  ],
  relatedSkills: ['run'],
  status: 'active',
  pushCount: 0,
  lastPushedAt: null,
};

describe('createDailySkillContent', () => {
  it('renders preview text and card payload', () => {
    const content = createDailySkillContent(skill);

    expect(content.title).toContain('效果验证助手');
    expect(content.previewText).toContain('适合场景');
    expect(content.previewText).toContain('/verify');
    expect(content.previewText).toContain('技能文档');
    expect(content.previewText).toContain('https://github.com/calvinll/daily-skill-pusher/blob/main/docs/skills/verify.md');
    expect(content.previewText).toContain('run');
    expect(content.feishuCard.header.title.content).toContain('效果验证助手');
    expect(JSON.stringify(content.feishuCard)).toContain('docs/skills/verify.md');
    expect(content.feishuCard.elements.length).toBeGreaterThan(0);
  });
});
