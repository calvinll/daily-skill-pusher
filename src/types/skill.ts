import { z } from 'zod';

export const skillLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export const skillEnrichmentSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z.array(z.string().min(1)).min(1).optional(),
  tags: z.array(z.string().min(1)).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  recommendScore: z.number().min(0).max(100).optional(),
  universalityScore: z.number().min(0).max(100).optional(),
  scenes: z.array(z.string().min(1)).min(2).max(4).optional(),
  example: z.string().min(1).optional(),
  whyRecommended: z.string().min(1).optional(),
  links: z.array(skillLinkSchema).optional(),
  relatedSkills: z.array(z.string().min(1)).optional(),
  themes: z.array(z.string().min(1)).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  pushCount: z.number().int().min(0).optional(),
  lastPushedAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export const skillSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.array(z.string().min(1)).min(1),
  tags: z.array(z.string().min(1)).default([]),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  recommendScore: z.number().min(0).max(100),
  universalityScore: z.number().min(0).max(100).default(80),
  scenes: z.array(z.string().min(1)).min(2).max(4),
  example: z.string().min(1),
  whyRecommended: z.string().min(1),
  links: z.array(skillLinkSchema).min(1),
  relatedSkills: z.array(z.string().min(1)).default([]),
  themes: z.array(z.string().min(1)).min(1),
  status: z.enum(['active', 'inactive']),
  pushCount: z.number().int().min(0).default(0),
  lastPushedAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export const skillsSchema = z.array(skillSchema);
export const skillEnrichmentsSchema = z.array(skillEnrichmentSchema);

export type Skill = z.infer<typeof skillSchema>;
export type SkillEnrichment = z.infer<typeof skillEnrichmentSchema>;
