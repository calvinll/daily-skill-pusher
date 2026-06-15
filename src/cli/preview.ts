import type { AppConfig } from '../types/app-config.js';
import { SkillRepository } from '../repositories/skill.repository.js';
import { HistoryRepository } from '../repositories/history.repository.js';
import { createDailySkillContent } from '../services/content.service.js';
import { selectDailySkill } from '../services/selection.service.js';

export async function previewCommand(config: AppConfig): Promise<void> {
  const skillRepository = new SkillRepository(config.app.dataDir);
  const historyRepository = new HistoryRepository(config);
  const [skills, records] = await Promise.all([
    skillRepository.getActive(),
    historyRepository.getAll(),
  ]);

  const result = selectDailySkill(skills, records, new Date(), config.selection, config.app.timezone);
  const payload = createDailySkillContent(result.skill);

  console.log(payload.previewText);
}
