import { access } from 'node:fs/promises';
import path from 'node:path';

import cron from 'node-cron';

import type { AppConfig } from '../types/app-config.js';
import { HistoryRepository } from '../repositories/history.repository.js';
import { SkillRepository } from '../repositories/skill.repository.js';
import { isFeishuPlaceholderWebhook } from '../utils/feishu.js';

export async function validateCommand(config: AppConfig): Promise<void> {
  if (!cron.validate(config.scheduler.cronExpression)) {
    throw new Error(`Invalid cron expression: ${config.scheduler.cronExpression}`);
  }

  await Promise.all([
    access(path.join(config.app.dataDir, 'skills.json')),
    access(path.join(config.app.dataDir, 'push-history.json')),
  ]);

  const skillRepository = new SkillRepository(config.app.dataDir);
  const historyRepository = new HistoryRepository(config);

  await Promise.all([skillRepository.getAll(), historyRepository.getAll()]);

  if (isFeishuPlaceholderWebhook(config.channels.feishu.webhookUrl)) {
    console.warn('Validation warning: FEISHU_WEBHOOK_URL is still the placeholder value. Real pushes will fail until you update .env.');
  }

  if (!config.channels.feishu.enabled) {
    console.log('Validation info: Feishu robot push is currently disabled.');
  }

  if (config.channels.feishu.botSecret) {
    console.log('Validation info: Feishu bot secret signing is enabled.');
  }

  if (config.channels.feishu.requiredKeyword) {
    console.log(`Validation info: required keyword is configured: ${config.channels.feishu.requiredKeyword}`);
  }

  console.log('Validation passed.');
}
