import type { AppConfig } from '../types/app-config.js';
import { pushDailySkill } from '../services/push.service.js';

export async function pushCommand(
  config: AppConfig,
  options: { force?: boolean; dryRun?: boolean },
): Promise<void> {
  const result = await pushDailySkill(config, options);

  if (result.skipped) {
    if (result.pushResult.responseBody && typeof result.pushResult.responseBody === 'object' && 'message' in result.pushResult.responseBody) {
      console.log(String(result.pushResult.responseBody.message));
    } else {
      console.log('今日已推送，已跳过。');
    }
    return;
  }

  console.log(result.content);
  console.log(`\n推送结果：${result.pushResult.success ? 'success' : 'failed'}`);

  if (!result.pushResult.success && result.pushResult.errorMessage) {
    console.log(`错误信息：${result.pushResult.errorMessage}`);
  }
}
