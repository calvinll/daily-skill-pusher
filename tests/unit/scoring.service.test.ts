import { describe, expect, it } from 'vitest';

import type { PushRecord } from '../../src/types/push-record.js';
import type { Skill } from '../../src/types/skill.js';
import { scoreSkill } from '../../src/services/scoring.service.js';

const baseSkill: Skill = {
  name: 'code-review',
  title: '代码审查助手',
  description: 'desc',
  category: ['official', 'bundled-skill', 'quality'],
  tags: ['review', 'official'],
  difficulty: 'easy',
  recommendScore: 92,
  universalityScore: 95,
  scenes: ['a', 'b'],
  example: '/code-review high',
  whyRecommended: 'good',
  links: [{ label: '技能文档', url: 'https://github.com/calvinll/daily-skill-pusher/blob/main/docs/skills/code-review.md' }],
  relatedSkills: ['verify'],
  themes: ['high-frequency-productivity', 'official-high-value'],
  officialSignals: [],
  isOfficialRecent: false,
  isOfficialNoteworthy: false,
  officialSignalScore: 0,
  status: 'active',
  pushCount: 0,
  lastPushedAt: null,
};

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

describe('scoreSkill', () => {
  it('returns a bounded numeric score', () => {
    const result = scoreSkill(baseSkill, [baseSkill], [createRecord('code-review', '2026-06-01T09:00:00.000Z')], new Date('2026-06-11T09:00:00.000Z'));

    expect(result.skill.name).toBe('code-review');
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('boosts related official skills and smooths by difficulty', () => {
    const verify: Skill = {
      ...baseSkill,
      name: 'verify',
      title: '效果验证助手',
      difficulty: 'easy',
      recommendScore: 88,
      universalityScore: 88,
      relatedSkills: [],
      example: '/verify',
    };
    const hardDebug: Skill = {
      ...baseSkill,
      name: 'debug',
      title: '调试助手',
      difficulty: 'hard',
      recommendScore: 88,
      universalityScore: 88,
      category: ['official', 'bundled-skill', 'troubleshooting'],
      tags: ['debug', 'official'],
      relatedSkills: [],
      example: '/debug',
    };

    const records = [createRecord('code-review', '2026-06-10T09:00:00.000Z')];
    const relatedResult = scoreSkill(verify, [baseSkill, verify, hardDebug], records, new Date('2026-06-11T09:00:00.000Z'));
    const hardResult = scoreSkill(hardDebug, [baseSkill, verify, hardDebug], records, new Date('2026-06-11T09:00:00.000Z'));

    expect(relatedResult.score).toBeGreaterThan(hardResult.score);
  });

  it('boosts official recent and noteworthy signals', () => {
    const recentSkill: Skill = {
      ...baseSkill,
      name: 'reload-skills',
      title: '/reload-skills',
      officialSignals: [
        { source: 'changelog', url: 'https://code.claude.com/docs/en/changelog.md', signal: 'recent', weight: 4 },
        { source: 'whats-new', url: 'https://code.claude.com/docs/en/whats-new/2026-w22.md', signal: 'noteworthy', weight: 6 },
      ],
      isOfficialRecent: true,
      isOfficialNoteworthy: true,
      officialSignalScore: 10,
      relatedSkills: [],
    };
    const plainSkill: Skill = {
      ...baseSkill,
      name: 'plain-skill',
      title: '/plain-skill',
      officialSignals: [],
      isOfficialRecent: false,
      isOfficialNoteworthy: false,
      officialSignalScore: 0,
      relatedSkills: [],
    };

    const recentResult = scoreSkill(recentSkill, [recentSkill, plainSkill], [], new Date('2026-06-11T09:00:00.000Z'));
    const plainResult = scoreSkill(plainSkill, [recentSkill, plainSkill], [], new Date('2026-06-11T09:00:00.000Z'));

    expect(recentResult.score).toBeGreaterThan(plainResult.score);
  });
});
