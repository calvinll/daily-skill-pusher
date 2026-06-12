import path from 'node:path';

import { skillsSchema, type Skill } from '../types/skill.js';
import { readJsonFile } from '../utils/file.js';

export class SkillRepository {
  constructor(private readonly dataDir: string) {}

  async getAll(): Promise<Skill[]> {
    const filePath = path.join(this.dataDir, 'skills.json');
    const raw = await readJsonFile<unknown>(filePath);
    return skillsSchema.parse(raw);
  }

  async getActive(): Promise<Skill[]> {
    const skills = await this.getAll();
    return skills.filter((skill) => skill.status === 'active');
  }
}
