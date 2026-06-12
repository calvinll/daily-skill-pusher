import path from 'node:path';

import type { AppConfig } from '../types/app-config.js';
import { pushRecordsSchema, type PushRecord } from '../types/push-record.js';
import { readJsonFile, writeJsonFile } from '../utils/file.js';
import { getLocalDateKey, isWithinDays } from '../utils/date.js';

export class HistoryRepository {
  constructor(private readonly config: AppConfig) {}

  private get filePath(): string {
    return path.join(this.config.app.dataDir, 'push-history.json');
  }

  async getAll(): Promise<PushRecord[]> {
    const raw = await readJsonFile<unknown>(this.filePath);
    return pushRecordsSchema.parse(raw);
  }

  async saveAll(records: PushRecord[]): Promise<void> {
    await writeJsonFile(this.filePath, records);
  }

  async append(record: PushRecord): Promise<void> {
    const records = await this.getAll();
    records.push(record);
    await this.saveAll(records);
  }

  async hasSuccessfulPushOnDate(date: Date): Promise<boolean> {
    const dateKey = getLocalDateKey(date, this.config.app.timezone);
    const records = await this.getAll();

    return records.some(
      (record) => record.status === 'success' && record.date === dateKey,
    );
  }

  async getRecentSuccessfulRecords(now: Date, days: number): Promise<PushRecord[]> {
    const records = await this.getAll();
    return records.filter(
      (record) =>
        record.status === 'success' && isWithinDays(record.createdAt, now, days),
    );
  }
}
