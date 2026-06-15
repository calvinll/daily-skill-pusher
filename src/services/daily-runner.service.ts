import type { AppConfig } from '../types/app-config.js';
import type { PushResult } from '../types/channel.js';
import type { PushRecord } from '../types/push-record.js';
import { createId } from '../utils/id.js';
import { getIsoTimestamp, getLocalDateKey } from '../utils/date.js';
import { isFeishuPlaceholderWebhook } from '../utils/feishu.js';
import { createDailySkillContent } from './content.service.js';
import { selectDailySkill } from './selection.service.js';
import { HistoryRepository } from '../repositories/history.repository.js';
import { SkillRepository } from '../repositories/skill.repository.js';
import { FeishuAdapter } from '../channels/feishu.adapter.js';

export type RunDailyPushOptions = {
  now?: Date;
  force?: boolean;
  dryRun?: boolean;
};

export type RunDailyPushResult = {
  selectedSkill: string;
  content: string;
  pushResult: PushResult;
  record?: PushRecord;
  skipped: boolean;
};

export async function runDailyPush(
  config: AppConfig,
  options: RunDailyPushOptions = {},
): Promise<RunDailyPushResult> {
  const now = options.now ?? new Date();

  if (!config.channels.feishu.enabled && !options.dryRun) {
    return {
      selectedSkill: '',
      content: '',
      pushResult: {
        success: true,
        channel: 'feishu',
        responseBody: { message: 'Feishu robot push is disabled.' },
      },
      skipped: true,
    };
  }

  const skillRepository = new SkillRepository(config.app.dataDir);
  const historyRepository = new HistoryRepository(config);

  if (!options.force && (await historyRepository.hasSuccessfulPushOnDate(now))) {
    return {
      selectedSkill: '',
      content: '',
      pushResult: {
        success: true,
        channel: 'feishu',
        responseBody: { message: 'Already pushed today.' },
      },
      skipped: true,
    };
  }

  const [skills, records] = await Promise.all([
    skillRepository.getActive(),
    historyRepository.getAll(),
  ]);

  const selected = selectDailySkill(skills, records, now, config.selection, config.app.timezone);
  const payload = createDailySkillContent(selected.skill);

  if (options.dryRun) {
    return {
      selectedSkill: selected.skill.name,
      content: payload.previewText,
      pushResult: {
        success: true,
        channel: 'feishu',
        responseBody: { dryRun: true },
      },
      skipped: false,
    };
  }

  if (isFeishuPlaceholderWebhook(config.channels.feishu.webhookUrl)) {
    return {
      selectedSkill: selected.skill.name,
      content: payload.previewText,
      pushResult: {
        success: false,
        channel: 'feishu',
        errorMessage: 'FEISHU_WEBHOOK_URL is still the placeholder value. Please update .env with a real webhook before pushing.',
      },
      skipped: false,
    };
  }

  const adapter = new FeishuAdapter(config.channels.feishu);
  const pushResult = await adapter.send(payload);

  const record: PushRecord = {
    id: createId('push'),
    date: getLocalDateKey(now, config.app.timezone),
    skillName: selected.skill.name,
    channel: adapter.channelName,
    content: payload.previewText,
    selectedTheme: selected.selectedTheme,
    status: pushResult.success ? 'success' : 'failed',
    errorMessage: pushResult.errorMessage,
    createdAt: getIsoTimestamp(now),
  };

  await historyRepository.append(record);

  return {
    selectedSkill: selected.skill.name,
    content: payload.previewText,
    pushResult,
    record,
    skipped: false,
  };
}
