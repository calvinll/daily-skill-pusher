import type { AppConfig } from '../types/app-config.js';
import { createDailySkillContent } from '../services/content.service.js';
import { selectDailySkill } from '../services/selection.service.js';
import { HistoryRepository } from '../repositories/history.repository.js';
import { SkillRepository } from '../repositories/skill.repository.js';
import { buildHistoryItems, buildSkillSummaries, type TodayViewModel } from './view-models.js';

export class WebApiService {
  private readonly skillRepository: SkillRepository;
  private readonly historyRepository: HistoryRepository;

  constructor(private readonly config: AppConfig) {
    this.skillRepository = new SkillRepository(config.app.dataDir);
    this.historyRepository = new HistoryRepository(config);
  }

  async getToday(): Promise<TodayViewModel> {
    const [skills, records] = await Promise.all([
      this.skillRepository.getActive(),
      this.historyRepository.getAll(),
    ]);

    const selected = selectDailySkill(skills, records, new Date(), this.config.selection, this.config.app.timezone);
    const payload = createDailySkillContent(selected.skill);

    return {
      selectedTheme: selected.selectedTheme,
      selectedSkill: selected.skill,
      previewText: payload.previewText,
    };
  }

  async getHistory() {
    const [skills, records] = await Promise.all([
      this.skillRepository.getAll(),
      this.historyRepository.getAll(),
    ]);
    const skillMap = new Map(skills.map((skill) => [skill.name, skill]));
    return buildHistoryItems(records, skillMap);
  }

  async getSkills() {
    const skills = await this.skillRepository.getAll();
    return buildSkillSummaries(skills);
  }

  async getSkillDetail(name: string) {
    const skills = await this.skillRepository.getAll();
    return skills.find((skill) => skill.name === name) ?? null;
  }
}
