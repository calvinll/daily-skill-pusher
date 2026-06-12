import path from 'node:path';
import dotenv from 'dotenv';

import { envSchema, type EnvConfig } from './schema.js';

export function loadEnv(cwd: string = process.cwd()): EnvConfig {
  dotenv.config({ path: path.join(cwd, '.env') });
  return envSchema.parse(process.env);
}
