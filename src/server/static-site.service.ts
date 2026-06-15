import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { AppConfig } from '../types/app-config.js';
import { WebApiService } from './web-api.service.js';

async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

async function copyDir(sourceDir: string, targetDir: string): Promise<void> {
  await ensureDir(targetDir);
  const entries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath);
    } else {
      await copyFile(sourcePath, targetPath);
    }
  }
}

function rewriteApiReferences(html: string): string {
  return html.replace('/assets/app.js', '/assets/app.js');
}

function rewriteFrontendForStatic(js: string): string {
  return js.replace(/fetchJson\('\/api\/today'\)/g, "fetchJson('/data/today.json')")
    .replace(/fetchJson\('\/api\/history'\)/g, "fetchJson('/data/history.json')")
    .replace(/fetchJson\('\/api\/skills'\)/g, "fetchJson('/data/skills.json')");
}

export async function buildStaticSite(config: AppConfig): Promise<string> {
  const api = new WebApiService(config);
  const root = process.cwd();
  const webDir = path.join(root, 'web');
  const distDir = path.join(root, 'dist-web');
  const dataDir = path.join(distDir, 'data');
  const assetsDir = path.join(distDir, 'assets');

  await ensureDir(distDir);
  await ensureDir(dataDir);
  await ensureDir(assetsDir);

  await copyDir(path.join(webDir, 'assets'), assetsDir);

  const [today, history, skills] = await Promise.all([
    api.getToday(),
    api.getHistory(),
    api.getSkills(),
  ]);

  const skillDetails = await Promise.all(
    skills.map(async (skill) => ({
      name: skill.name,
      detail: await api.getSkillDetail(skill.name),
    })),
  );

  await writeFile(path.join(dataDir, 'today.json'), `${JSON.stringify(today, null, 2)}\n`, 'utf8');
  await writeFile(path.join(dataDir, 'history.json'), `${JSON.stringify(history, null, 2)}\n`, 'utf8');
  await writeFile(path.join(dataDir, 'skills.json'), `${JSON.stringify(skills, null, 2)}\n`, 'utf8');
  await writeFile(path.join(dataDir, 'skill-details.json'), `${JSON.stringify(skillDetails, null, 2)}\n`, 'utf8');

  for (const page of ['index.html', 'history.html', 'skills.html']) {
    const html = await readFile(path.join(webDir, page), 'utf8');
    await writeFile(path.join(distDir, page), rewriteApiReferences(html), 'utf8');
  }

  const appJs = await readFile(path.join(webDir, 'assets/app.js'), 'utf8');
  await writeFile(path.join(assetsDir, 'app.js'), rewriteFrontendForStatic(appJs), 'utf8');

  return distDir;
}
