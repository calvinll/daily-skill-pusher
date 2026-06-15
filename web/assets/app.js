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

function badge(label) {
  return `<span class="badge">${label}</span>`;
}

function renderToday(data) {
  const el = document.getElementById('today-card');
  if (!el) return;
  el.innerHTML = `
    <div class="card-header">
      <div>
        <p class="eyebrow">Today’s pick</p>
        <h2>${data.selectedSkill.title}</h2>
      </div>
      <div class="badge-group">
        ${badge(data.selectedTheme ?? '未分配')}
        ${data.selectedSkill.isOfficialNoteworthy ? badge('官方值得关注') : ''}
      </div>
    </div>
    <p class="lead">${data.selectedSkill.description}</p>
    <section class="section-block">
      <h3>适合场景</h3>
      <ul class="bullet-list">${data.selectedSkill.scenes.map((scene) => `<li>${scene}</li>`).join('')}</ul>
    </section>
    <section class="section-block split-grid">
      <div>
        <h3>推荐用法</h3>
        <pre>${data.selectedSkill.example}</pre>
      </div>
      <div>
        <h3>为什么推荐</h3>
        <p>${data.selectedSkill.whyRecommended}</p>
      </div>
    </section>
    <section class="section-block">
      <h3>继续探索</h3>
      <div class="badge-group">${data.selectedSkill.themes.map((theme) => badge(theme)).join('')}</div>
      <p class="link-row"><a href="${data.selectedSkill.links[0]?.url ?? '#'}" target="_blank" rel="noreferrer">查看官方文档 →</a></p>
    </section>
  `;
}

function renderHistory(items) {
  const el = document.getElementById('history-list');
  if (!el) return;
  el.innerHTML = items.map((item) => `
    <article class="card history-card">
      <div class="card-header">
        <div>
          <h2>${item.title}</h2>
          <p class="meta">${item.date}</p>
        </div>
        <div class="badge-group">
          ${badge(item.selectedTheme ?? '未分配')}
          ${badge(item.status)}
        </div>
      </div>
      <pre>${item.content}</pre>
    </article>
  `).join('');
}

function renderSkills(items) {
  const el = document.getElementById('skills-list');
  if (!el) return;
  el.innerHTML = items.map((item) => `
    <article class="card skill-card">
      <div class="card-header">
        <h2>${item.title}</h2>
        <div class="badge-group">${item.themes.map((theme) => badge(theme)).join('')}</div>
      </div>
      <p class="lead">${item.description}</p>
      <p class="link-row"><a href="${item.links[0]?.url ?? '#'}" target="_blank" rel="noreferrer">查看官方文档 →</a></p>
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
