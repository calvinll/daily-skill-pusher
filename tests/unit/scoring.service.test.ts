import { describe, expect, it } from 'vitest';

import type { PushRecord } from '../../src/types/push-record.js';
import type { Skill } from '../../src/types/skill.js';
import { scoreSkill } from '../../src/services/scoring.service.js';

const skill: Skill = {
  name: 'code-review',
  title: '代码审查助手',
  description: 'desc',
  category: ['quality'],
  tags: ['review'],
  difficulty: 'easy',
  recommendScore: 92,
  universalityScore: 95,
  scenes: ['a', 'b'],
  example: '/code-review high',
  whyRecommended: 'good',
  links: [{ label: '技能文档', url: 'https://github.com/calvinll/daily-skill-pusher/blob/main/docs/skills/code-review.md' }],
  relatedSkills: [],
  status: 'active',
  pushCount: 0,
  lastPushedAt: null,
};

function createRecord(createdAt: string): PushRecord {
  return {
    id: 'push_1',
    date: '2026-06-10',
    skillName: 'code-review',
    channel: 'feishu',
    content: 'content',
    status: 'success',
    createdAt,
  };
}

describe('scoreSkill', () => {
  it('returns a bounded numeric score', () => {
    const result = scoreSkill(skill, [createRecord('2026-06-01T09:00:00.000Z')], new Date('2026-06-11T09:00:00.000Z'));

    expect(result.skill.name).toBe('code-review');
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
