import path from 'node:path';

import { fetchOfficialClaudeCodeSkills } from '../sources/claude-code-docs.source.js';
import {
  skillEnrichmentsSchema,
  skillSchema,
  type Skill,
  type SkillEnrichment,
} from '../types/skill.js';
import { readJsonFileIfExists } from '../utils/file.js';

type SkillSeed = {
  name: string;
  title: string;
  description: string;
  docsUrl: string;
};

type SkillPreset = {
  title?: string;
  description?: string;
  category?: Skill['category'];
  tags?: Skill['tags'];
  difficulty?: Skill['difficulty'];
  recommendScore?: Skill['recommendScore'];
  universalityScore?: Skill['universalityScore'];
  scenes?: Skill['scenes'];
  example?: Skill['example'];
  whyRecommended?: Skill['whyRecommended'];
  relatedSkills?: Skill['relatedSkills'];
  status?: Skill['status'];
  pushCount?: Skill['pushCount'];
  lastPushedAt?: Skill['lastPushedAt'];
};

const SKILL_PRESETS: Record<string, SkillPreset> = {
  'code-review': {
    category: ['official', 'bundled-skill', 'quality'],
    tags: ['review', 'quality', 'pre-commit'],
    difficulty: 'easy',
    recommendScore: 92,
    universalityScore: 95,
    scenes: ['提交代码前快速自查', '定位改动中的明显 bug', '寻找可以简化的实现'],
    example: '/code-review high',
    whyRecommended: '高频、通用、见效快，适合养成提交前自检习惯。',
    relatedSkills: ['simplify', 'verify'],
  },
  verify: {
    category: ['official', 'bundled-skill', 'verification'],
    tags: ['verification', 'manual-test'],
    difficulty: 'easy',
    recommendScore: 90,
    universalityScore: 90,
    scenes: ['改完功能后做一次手动验证', '提交前确认 bug 已修复', '需要验证 PR 的真实效果'],
    example: '/verify',
    whyRecommended: '适合和 review、test 搭配，防止“代码改了但没生效”。',
    relatedSkills: ['code-review', 'run'],
  },
  run: {
    category: ['official', 'bundled-skill', 'execution'],
    tags: ['run', 'manual-check'],
    difficulty: 'easy',
    recommendScore: 89,
    universalityScore: 92,
    scenes: ['想把项目直接跑起来看实际效果', '不想只靠看代码或测试判断改动是否生效'],
    example: '/run',
    whyRecommended: '适合把“写完代码”推进到“真实跑起来看结果”这一步。',
    relatedSkills: ['verify'],
  },
  loop: {
    category: ['official', 'bundled-skill', 'automation'],
    tags: ['loop', 'polling', 'follow-up'],
    difficulty: 'easy',
    recommendScore: 90,
    universalityScore: 92,
    scenes: ['想定时检查某件事有没有变化', '想持续跟进任务进展，不想反复手动催', '想把轮询、观察、提醒这类动作交给 Claude'],
    example: '/loop 5m check if the deploy finished',
    whyRecommended: '很适合“要持续盯着，但不值得你手动反复问”的任务，能把重复观察自动化。',
    relatedSkills: ['run', 'verify'],
  },
  'claude-api': {
    category: ['official', 'bundled-skill', 'reference'],
    tags: ['api', 'sdk', 'reference'],
    difficulty: 'medium',
    recommendScore: 88,
    universalityScore: 86,
    scenes: ['想快速确认 Claude API 或 SDK 的正确用法', '写接入代码时想减少拍脑袋试错'],
    example: '/claude-api',
    whyRecommended: '当你要查 Claude API、SDK、流式输出或工具调用时，这类官方参考 skill 非常省时间。',
    relatedSkills: [],
  },
};

function genericScenes(name: string): string[] {
  return [
    `想快速理解官方 skill /${name} 适合解决什么问题`,
    `准备试用 /${name}，希望先拿到一个明确使用场景`,
  ];
}

function defaultRecommendScore(name: string): number {
  const highValue = new Set(['code-review', 'verify', 'run', 'loop', 'claude-api']);
  return highValue.has(name) ? 90 : 80;
}

function defaultUniversalityScore(name: string): number {
  const broad = new Set(['code-review', 'verify', 'run', 'loop']);
  return broad.has(name) ? 92 : 80;
}

function buildDefaultWhyRecommended(seed: SkillSeed): string {
  return `来自 Claude Code 官方文档的内置 skill。${seed.title} 适合先作为官方能力了解和试用入口，再决定是否纳入日常工作流。`;
}

function mergeLinks(seed: SkillSeed, enrichment?: SkillEnrichment) {
  const officialLink = {
    label: 'Claude Code官方文档',
    url: seed.docsUrl,
  };

  const extras = (enrichment?.links ?? []).filter((link) => link.url !== seed.docsUrl);
  return [officialLink, ...extras];
}

function mergeSkill(seed: SkillSeed, enrichment?: SkillEnrichment): Skill {
  const preset = SKILL_PRESETS[seed.name];

  return skillSchema.parse({
    name: seed.name,
    title: enrichment?.title ?? preset?.title ?? seed.title,
    description: enrichment?.description ?? preset?.description ?? seed.description,
    category: enrichment?.category ?? preset?.category ?? ['official', 'bundled-skill'],
    tags: Array.from(
      new Set([...(preset?.tags ?? []), ...(enrichment?.tags ?? []), 'official', 'bundled-skill']),
    ),
    difficulty: enrichment?.difficulty ?? preset?.difficulty ?? 'medium',
    recommendScore: enrichment?.recommendScore ?? preset?.recommendScore ?? defaultRecommendScore(seed.name),
    universalityScore:
      enrichment?.universalityScore ?? preset?.universalityScore ?? defaultUniversalityScore(seed.name),
    scenes: enrichment?.scenes ?? preset?.scenes ?? genericScenes(seed.name),
    example: enrichment?.example ?? preset?.example ?? `/${seed.name}`,
    whyRecommended:
      enrichment?.whyRecommended ?? preset?.whyRecommended ?? buildDefaultWhyRecommended(seed),
    links: mergeLinks(seed, enrichment),
    relatedSkills: enrichment?.relatedSkills ?? preset?.relatedSkills ?? [],
    status: enrichment?.status ?? preset?.status ?? 'active',
    pushCount: enrichment?.pushCount ?? preset?.pushCount ?? 0,
    lastPushedAt: enrichment?.lastPushedAt ?? preset?.lastPushedAt ?? null,
  });
}

export class SkillRepository {
  constructor(private readonly dataDir: string) {}

  private async getEnrichments(): Promise<SkillEnrichment[]> {
    const filePath = path.join(this.dataDir, 'skills.json');
    const raw = await readJsonFileIfExists<unknown[]>(filePath, []);
    return skillEnrichmentsSchema.parse(raw);
  }

  async getAll(): Promise<Skill[]> {
    const [officialSkills, enrichments] = await Promise.all([
      fetchOfficialClaudeCodeSkills(),
      this.getEnrichments(),
    ]);

    const enrichmentMap = new Map(enrichments.map((skill) => [skill.name, skill]));

    return officialSkills.map((skill) => mergeSkill(skill, enrichmentMap.get(skill.name)));
  }

  async getActive(): Promise<Skill[]> {
    const skills = await this.getAll();
    return skills.filter((skill) => skill.status === 'active');
  }
}
