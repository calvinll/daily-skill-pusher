import { describe, expect, it } from 'vitest';

import { skillSchema } from '../../src/types/skill.js';

describe('skillSchema', () => {
  it('requires at least one clickable link per skill', () => {
    const result = skillSchema.safeParse({
      name: 'verify',
      title: '效果验证助手',
      description: 'desc',
      category: ['quality'],
      tags: ['verify'],
      difficulty: 'easy',
      recommendScore: 90,
      universalityScore: 90,
      scenes: ['a', 'b'],
      example: '/verify',
      whyRecommended: 'good',
      links: [],
      relatedSkills: [],
      status: 'active',
      pushCount: 0,
      lastPushedAt: null,
    });

    expect(result.success).toBe(false);
  });
});
