import type { AppConfig } from '../types/app-config.js';
import { buildStaticSite } from '../server/static-site.service.js';

export async function buildWebCommand(config: AppConfig): Promise<void> {
  const outputDir = await buildStaticSite(config);
  console.log(`static site built at ${outputDir}`);
}
