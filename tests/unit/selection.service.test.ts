import { describe, expect, it } from 'vitest';

import type { SelectionConfig } from '../../src/types/app-config.js';
import type { PushRecord } from '../../src/types/push-record.js';
import type { Skill } from '../../src/types/skill.js';
import { selectDailySkill } from '../../src/services/selection.service.js';

const baseConfig: SelectionConfig = {
  daysToAvoidRepeat: 14,
  avoidSameCategoryDays: 2,
  dailyCount: 1,
};

const skills: Skill[] = [
  {
    name: 'code-review',
    title: '代码审查助手',
    description: 'desc',
    category: ['official', 'bundled-skill', 'quality', 'review'],
    tags: ['review', 'official'],
    difficulty: 'easy',
    recommendScore: 92,
    universalityScore: 95,
    scenes: ['a', 'b'],
    example: '/code-review high',
    whyRecommended: 'good',
    links: [
      {
        label: '技能文档',
        url: 'https://github.com/calvinll/daily-skill-pusher/blob/main/docs/skills/code-review.md',
      },
    ],
    relatedSkills: ['verify'],
    themes: ['high-frequency-productivity', 'official-high-value'],
    status: 'active',
    pushCount: 0,
    lastPushedAt: null,
  },
  {
    name: 'verify',
    title: '效果验证助手',
    description: 'desc',
    category: ['official', 'bundled-skill', 'verification'],
    tags: ['verification', 'official'],
    difficulty: 'easy',
    recommendScore: 88,
    universalityScore: 88,
    scenes: ['a', 'b'],
    example: '/verify',
    whyRecommended: 'good',
    links: [
      {
        label: '技能文档',
        url: 'https://github.com/calvinll/daily-skill-pusher/blob/main/docs/skills/verify.md',
      },
    ],
    relatedSkills: [],
    themes: ['high-frequency-productivity', 'official-high-value', 'learning-path'],
    status: 'active',
    pushCount: 0,
    lastPushedAt: null,
  },
  {
    name: 'vitest',
    title: 'Vitest',
    description: 'desc',
    category: ['testing'],
    tags: ['testing'],
    difficulty: 'medium',
    recommendScore: 88,
    universalityScore: 82,
    scenes: ['a', 'b'],
    example: '/vitest',
    whyRecommended: 'good',
    links: [
      {
        label: '技能文档',
        url: 'https://github.com/calvinll/daily-skill-pusher/blob/main/docs/skills/vitest.md',
      },
    ],
    relatedSkills: ['verify'],
    themes: ['high-frequency-productivity'],
    status: 'active',
    pushCount: 0,
    lastPushedAt: null,
  },
];

function createRecord(skillName: string, createdAt: string): PushRecord {
  return {
    id: `push_${skillName}`,
    date: '2026-06-10',
    skillName,
    channel: 'feishu',
    content: 'content',
    status: 'success',
    createdAt,
  };
}

describe('selectDailySkill', () => {
  it('avoids recently pushed skill', () => {
    const now = new Date('2026-06-11T09:00:00.000Z');
    const records = [createRecord('code-review', '2026-06-10T09:00:00.000Z')];

    const result = selectDailySkill(skills, records, now, baseConfig);

    expect(result.skill.name).toBe('vitest');
  });

  it('falls back to relaxed repeat window when needed', () => {
    const now = new Date('2026-06-11T09:00:00.000Z');
    const records = [
      createRecord('code-review', '2026-06-01T09:00:00.000Z'),
      createRecord('verify', '2026-06-05T09:00:00.000Z'),
      createRecord('vitest', '2026-06-09T09:00:00.000Z'),
    ];

    const result = selectDailySkill(skills, records, now, baseConfig);

    expect(result.skill.name).toBe('code-review');
  });

  it('prefers a related follow-up skill after a previous recommendation', () => {
    const now = new Date('2026-06-11T09:00:00.000Z');
    const records = [createRecord('code-review', '2026-05-20T09:00:00.000Z')];

    const result = selectDailySkill(skills, records, now, baseConfig);

    expect(result.skill.name).toBe('verify');
    expect(result.selectedTheme).toBe('official-high-value');
  });
});
