import { z } from 'zod';

export const pushRecordSchema = z.object({
  id: z.string().min(1),
  date: z.string().min(1),
  skillName: z.string().min(1),
  channel: z.string().min(1),
  content: z.string().min(1),
  status: z.enum(['success', 'failed', 'skipped']),
  errorMessage: z.string().optional(),
  createdAt: z.string().datetime({ offset: true }),
});

export const pushRecordsSchema = z.array(pushRecordSchema);

export type PushRecord = z.infer<typeof pushRecordSchema>;
