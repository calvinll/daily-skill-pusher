import type { AppConfig } from '../types/app-config.js';
import { startWebServer } from '../server/web.server.js';

export async function webCommand(config: AppConfig): Promise<void> {
  await startWebServer(config);
}
