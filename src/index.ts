import { Command } from 'commander';
import process from 'node:process';

import { createAppConfig } from './config/app-config.js';
import { loadEnv } from './config/env.js';
import { buildWebCommand } from './cli/build-web.js';
import { previewCommand } from './cli/preview.js';
import { pushCommand } from './cli/push.js';
import { scheduleCommand } from './cli/schedule.js';
import { validateCommand } from './cli/validate.js';
import { webCommand } from './cli/web.js';

async function main(): Promise<void> {
  const env = loadEnv();
  const config = createAppConfig(env);
  const program = new Command();

  program.name('daily-skill-pusher').description('Daily curated skill push tool');

  program
    .command('preview')
    .description('Preview today\'s selected skill content')
    .action(async () => {
      await previewCommand(config);
    });

  program
    .command('push')
    .description('Push today\'s selected skill')
    .option('--force', 'Force push even if already pushed today')
    .option('--dry-run', 'Render content without sending webhook')
    .action(async (options: { force?: boolean; dryRun?: boolean }) => {
      await pushCommand(config, options);
    });

  program
    .command('schedule')
    .description('Start cron scheduler')
    .action(async () => {
      await scheduleCommand(config);
    });

  program
    .command('validate')
    .description('Validate env and data files')
    .action(async () => {
      await validateCommand(config);
    });

  program
    .command('web')
    .description('Start the showcase web server')
    .action(async () => {
      await webCommand(config);
    });

  program
    .command('build-web')
    .description('Build the static showcase site for deployment')
    .action(async () => {
      await buildWebCommand(config);
    });

  await program.parseAsync(process.argv);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
