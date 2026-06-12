import { z } from 'zod';

export const skillLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
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
  status: z.enum(['active', 'inactive']),
  pushCount: z.number().int().min(0).default(0),
  lastPushedAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export const skillsSchema = z.array(skillSchema);

export type Skill = z.infer<typeof skillSchema>;
