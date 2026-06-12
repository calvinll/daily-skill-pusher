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
  batch: {
    category: ['official', 'bundled-skill', 'orchestration'],
    tags: ['batch', 'parallel', 'multi-agent'],
    difficulty: 'hard',
    recommendScore: 91,
    universalityScore: 84,
    scenes: ['想把一个大改动拆成多个独立小任务并行推进', '需要跨代码库多处修改，单线程做太慢'],
    example: '/batch 把整个项目里的旧接口调用迁移到新 SDK',
    whyRecommended: '适合大范围改动和并行处理任务，能把原本需要人工拆分的工作交给 Claude 执行。',
    relatedSkills: ['code-review', 'loop'],
  },
  simplify: {
    category: ['official', 'bundled-skill', 'cleanup'],
    tags: ['simplify', 'cleanup', 'refactor'],
    difficulty: 'easy',
    recommendScore: 89,
    universalityScore: 88,
    scenes: ['改完代码后想顺手清理冗余实现', '希望把改动整理得更简洁、更顺手维护'],
    example: '/simplify',
    whyRecommended: '它不强调找 bug，而是专注于让代码更干净、更顺手，是提交前很好用的一步。',
    relatedSkills: ['code-review', 'verify'],
  },
  debug: {
    category: ['official', 'bundled-skill', 'troubleshooting'],
    tags: ['debug', 'logs', 'diagnostics'],
    difficulty: 'medium',
    recommendScore: 86,
    universalityScore: 82,
    scenes: ['Claude Code 自己行为异常，想快速排查原因', '需要读取调试日志来定位 CLI 或工具调用问题'],
    example: '/debug',
    whyRecommended: '当问题不在业务代码而在 Claude Code 本身时，这类诊断 skill 很有价值。',
    relatedSkills: ['code-review'],
  },
  'reload-skills': {
    category: ['official', 'skill-workflow', 'refresh'],
    tags: ['reload-skills', 'skills', 'commands'],
    difficulty: 'easy',
    recommendScore: 91,
    universalityScore: 85,
    scenes: ['刚新增或修改了本地 skill，不想重启 Claude Code 会话', '团队在试装自定义 skills，希望马上验证是否生效'],
    example: '/reload-skills',
    whyRecommended: '它能让 skill 的安装、调试和分发流程顺畅很多，特别适合正在推广自定义 skill 的团队。',
    relatedSkills: ['loop', 'claude-api'],
  },
  'run-skill-generator': {
    category: ['official', 'bundled-skill', 'workflow-setup'],
    tags: ['run-skill-generator', 'run', 'verify', 'setup'],
    difficulty: 'medium',
    recommendScore: 89,
    universalityScore: 84,
    scenes: ['项目启动方式比较复杂，想让 /run 和 /verify 更稳定', '希望把项目运行方法沉淀成可复用 skill'],
    example: '/run-skill-generator',
    whyRecommended: '它适合把项目运行流程沉淀成标准 skill，后面再用 /run 和 /verify 会稳定很多。',
    relatedSkills: ['run', 'verify'],
  },
  'fewer-permission-prompts': {
    category: ['official', 'bundled-skill', 'workflow-setup'],
    tags: ['permissions', 'settings', 'productivity'],
    difficulty: 'easy',
    recommendScore: 87,
    universalityScore: 86,
    scenes: ['频繁被只读命令权限弹窗打断', '想给团队项目补一版更顺手的 Claude 权限配置'],
    example: '/fewer-permission-prompts',
    whyRecommended: '如果你已经知道常用读操作都很安全，这个 skill 能明显减少权限确认带来的中断。',
    relatedSkills: ['reload-skills', 'claude-api'],
  },
};

function genericScenes(name: string): string[] {
  return [
    `想快速理解官方 skill /${name} 适合解决什么问题`,
    `准备试用 /${name}，希望先拿到一个明确使用场景`,
  ];
}

function defaultRecommendScore(name: string): number {
  const highValue = new Set(['code-review', 'verify', 'run', 'loop', 'claude-api', 'batch', 'simplify', 'reload-skills', 'run-skill-generator', 'fewer-permission-prompts']);
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
