import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { AppConfig } from '../types/app-config.js';
import { WebApiService } from './web-api.service.js';

function json(data: unknown, statusCode = 200): Response {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });
}

function html(content: string, statusCode = 200): Response {
  return new Response(content, {
    status: statusCode,
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  });
}

export async function startWebServer(config: AppConfig): Promise<void> {
  const apiService = new WebApiService(config);
  const webRoot = path.resolve(process.cwd(), 'web');

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');

    let response: Response;
    try {
      if (url.pathname === '/api/today') {
        response = json(await apiService.getToday());
      } else if (url.pathname === '/api/history') {
        response = json(await apiService.getHistory());
      } else if (url.pathname === '/api/skills') {
        response = json(await apiService.getSkills());
      } else if (url.pathname.startsWith('/api/skills/')) {
        const name = decodeURIComponent(url.pathname.replace('/api/skills/', ''));
        const detail = await apiService.getSkillDetail(name);
        response = detail ? json(detail) : json({ message: 'Not found' }, 404);
      } else {
        const filePath =
          url.pathname === '/' ? path.join(webRoot, 'index.html') : path.join(webRoot, url.pathname.replace(/^\//, ''));
        const content = await readFile(filePath, 'utf8');
        response = html(content);
      }
    } catch (error) {
      response = json({ message: error instanceof Error ? error.message : 'Unknown server error' }, 500);
    }

    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(await response.text());
  });

  await new Promise<void>((resolve) => server.listen(config.app.webPort, '0.0.0.0', () => resolve()));
  console.log(`web server listening on :${config.app.webPort}`);
}
