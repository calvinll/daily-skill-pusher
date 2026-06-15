function getBasePath() {
  if (window.location.hostname.endsWith('github.io')) {
    const segments = window.location.pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      return `/${segments[0]}`;
    }
  }
  return '';
}

const BASE_PATH = getBasePath();

function withBasePath(relativePath) {
  return `${BASE_PATH}${relativePath}`;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}`);
  return response.json();
}

function renderToday(data) {
  const el = document.getElementById('today-card');
  if (!el) return;
  el.innerHTML = `
    <h2>${data.selectedSkill.title}</h2>
    <p class="meta">主题：${data.selectedTheme ?? '未分配'}</p>
    <p>${data.selectedSkill.description}</p>
    <h3>适合场景</h3>
    <ul>${data.selectedSkill.scenes.map((scene) => `<li>${scene}</li>`).join('')}</ul>
    <h3>推荐用法</h3>
    <pre>${data.selectedSkill.example}</pre>
    <h3>为什么推荐</h3>
    <p>${data.selectedSkill.whyRecommended}</p>
  `;
}

function renderHistory(items) {
  const el = document.getElementById('history-list');
  if (!el) return;
  el.innerHTML = items.map((item) => `
    <article class="card">
      <h2>${item.title}</h2>
      <p class="meta">${item.date} · ${item.selectedTheme ?? '未分配'} · ${item.status}</p>
      <pre>${item.content}</pre>
    </article>
  `).join('');
}

function renderSkills(items) {
  const el = document.getElementById('skills-list');
  if (!el) return;
  el.innerHTML = items.map((item) => `
    <article class="card">
      <h2>${item.title}</h2>
      <p>${item.description}</p>
      <p class="meta">主题：${item.themes.join(' / ')}</p>
      <p><a href="${item.links[0]?.url ?? '#'}" target="_blank" rel="noreferrer">查看官方文档</a></p>
    </article>
  `).join('');
}

const path = window.location.pathname;
const normalizedPath = BASE_PATH ? path.replace(BASE_PATH, '') || '/' : path;
if (normalizedPath === '/' || normalizedPath.endsWith('/index.html')) {
  fetchJson(withBasePath('/api/today')).then(renderToday).catch(console.error);
} else if (normalizedPath.endsWith('/history.html')) {
  fetchJson(withBasePath('/api/history')).then(renderHistory).catch(console.error);
} else if (normalizedPath.endsWith('/skills.html')) {
  fetchJson(withBasePath('/api/skills')).then(renderSkills).catch(console.error);
}
