import type { AppConfig } from '../types/app-config.js';
import { startCronScheduler } from '../scheduler/cron.scheduler.js';

export async function scheduleCommand(config: AppConfig): Promise<void> {
  if (!config.scheduler.enabled) {
    console.log('scheduler is disabled by SCHEDULER_ENABLED=false');
    return;
  }

  if (!config.channels.feishu.enabled) {
    console.log('Feishu robot push is disabled by FEISHU_ENABLED=false');
    return;
  }

  startCronScheduler(config);
  console.log(`scheduler started with cron: ${config.scheduler.cronExpression}`);
  console.log('note: this command must keep running; for true hosted daily automation, use GitHub Actions.');
}
