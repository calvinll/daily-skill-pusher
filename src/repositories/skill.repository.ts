import path from 'node:path';

import { fetchOfficialClaudeCodeSkills } from '../sources/claude-code-docs.source.js';
import {
  skillEnrichmentsSchema,
  skillSchema,
  type Skill,
  type SkillEnrichment,
} from '../types/skill.js';
import { readJsonFileIfExists } from '../utils/file.js';

function defaultScenes(name: string): string[] {
  return [
    `想了解 Claude Code 官方 skill /${name} 的用途`,
    `想直接在 Claude Code 中尝试 /${name}`,
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

function mergeSkill(seed: {
  name: string;
  title: string;
  description: string;
  docsUrl: string;
}, enrichment?: SkillEnrichment): Skill {
  return skillSchema.parse({
    name: seed.name,
    title: enrichment?.title ?? seed.title,
    description: enrichment?.description ?? seed.description,
    category: enrichment?.category ?? ['official', 'bundled-skill'],
    tags: Array.from(new Set([...(enrichment?.tags ?? []), 'official', 'bundled-skill'])),
    difficulty: enrichment?.difficulty ?? 'medium',
    recommendScore: enrichment?.recommendScore ?? defaultRecommendScore(seed.name),
    universalityScore: enrichment?.universalityScore ?? defaultUniversalityScore(seed.name),
    scenes: enrichment?.scenes ?? defaultScenes(seed.name),
    example: enrichment?.example ?? `/${seed.name}`,
    whyRecommended:
      enrichment?.whyRecommended ??
      `来自 Claude Code 官方文档的内置 skill，适合作为官方能力推荐。`,
    links: [
      {
        label: 'Claude Code官方文档',
        url: seed.docsUrl,
      },
    ],
    relatedSkills: enrichment?.relatedSkills ?? [],
    status: enrichment?.status ?? 'active',
    pushCount: enrichment?.pushCount ?? 0,
    lastPushedAt: enrichment?.lastPushedAt ?? null,
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
