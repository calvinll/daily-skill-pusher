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
      <div class="link-stack">
        <p class="link-row"><a href="./skill.html?name=${encodeURIComponent(data.selectedSkill.name)}">查看技能详情 →</a></p>
        <p class="link-row"><a href="${data.selectedSkill.links[0]?.url ?? '#'}" target="_blank" rel="noreferrer">查看官方文档 →</a></p>
      </div>
    </section>
  `;
}

function renderHistory(items) {
  const el = document.getElementById('history-list');
  const empty = document.getElementById('history-empty');
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
  if (empty) empty.hidden = items.length > 0;
}

function renderSkills(items) {
  const el = document.getElementById('skills-list');
  const empty = document.getElementById('skills-empty');
  if (!el) return;
  el.innerHTML = items.map((item) => `
    <article class="card skill-card">
      <div class="card-header">
        <h2>${item.title}</h2>
        <div class="badge-group">
          ${item.themes.map((theme) => badge(theme)).join('')}
          ${item.isOfficialRecent ? badge('官方近期') : ''}
          ${item.isOfficialNoteworthy ? badge('官方值得关注') : ''}
        </div>
      </div>
      <p class="lead">${item.description}</p>
      <p class="meta">难度：${item.difficulty} · 分类：${item.category.join(' / ')}</p>
      <div class="link-stack">
        <p class="link-row"><a href="./skill.html?name=${encodeURIComponent(item.name)}">查看技能详情 →</a></p>
        <p class="link-row"><a href="${item.links[0]?.url ?? '#'}" target="_blank" rel="noreferrer">查看官方文档 →</a></p>
      </div>
    </article>
  `).join('');
  if (empty) empty.hidden = items.length > 0;
}

async function fetchSkillDetail(name) {
  try {
    return await fetchJson(withBasePath(`/api/skills/${encodeURIComponent(name)}`));
  } catch {
    const all = await fetchJson(withBasePath('/data/skill-details.json'));
    const match = all.find((item) => item.name === name);
    if (!match) throw new Error(`Skill not found: ${name}`);
    return match.detail;
  }
}

function renderSkillDetail(skill) {
  const el = document.getElementById('skill-detail');
  if (!el) return;
  if (!skill) {
    el.innerHTML = '<h2>没有找到这个技能</h2><p class="lead">请从技能列表返回重新选择。</p>';
    return;
  }
  el.innerHTML = `
    <div class="card-header">
      <div>
        <p class="eyebrow">Skill profile</p>
        <h2>${skill.title}</h2>
      </div>
      <div class="badge-group">
        ${skill.themes.map((theme) => badge(theme)).join('')}
        ${skill.isOfficialRecent ? badge('官方近期') : ''}
        ${skill.isOfficialNoteworthy ? badge('官方值得关注') : ''}
      </div>
    </div>
    <p class="lead">${skill.description}</p>
    <section class="section-block split-grid">
      <div>
        <h3>适合场景</h3>
        <ul class="bullet-list">${skill.scenes.map((scene) => `<li>${scene}</li>`).join('')}</ul>
      </div>
      <div>
        <h3>推荐用法</h3>
        <pre>${skill.example}</pre>
      </div>
    </section>
    <section class="section-block split-grid">
      <div>
        <h3>为什么推荐</h3>
        <p>${skill.whyRecommended}</p>
      </div>
      <div>
        <h3>更多信息</h3>
        <p class="meta">难度：${skill.difficulty}</p>
        <p class="meta">分类：${skill.category.join(' / ')}</p>
        <p class="meta">标签：${skill.tags.join(' / ')}</p>
      </div>
    </section>
    <section class="section-block split-grid">
      <div>
        <h3>相关技能</h3>
        <div class="badge-group">${(skill.relatedSkills ?? []).map((item) => badge(item)).join('') || '<span class="meta">暂无</span>'}</div>
      </div>
      <div>
        <h3>使用入口</h3>
        <div class="link-stack">${skill.links.map((link) => `<p class="link-row"><a href="${link.url}" target="_blank" rel="noreferrer">${link.label} →</a></p>`).join('')}</div>
      </div>
    </section>
  `;
}

function populateThemeSelect(select, items, field = 'themes') {
  if (!select) return;
  const values = new Set();
  items.forEach((item) => {
    const raw = item[field];
    if (Array.isArray(raw)) raw.forEach((value) => values.add(value));
    else if (raw) values.add(raw);
  });
  select.innerHTML = `<option value="">全部主题</option>${Array.from(values).sort().map((value) => `<option value="${value}">${value}</option>`).join('')}`;
}

function bindSkillFilters(items) {
  const search = document.getElementById('skills-search');
  const theme = document.getElementById('skills-theme-filter');
  populateThemeSelect(theme, items);

  const rerender = () => {
    const keyword = search?.value?.trim().toLowerCase() ?? '';
    const themeValue = theme?.value ?? '';
    const filtered = items.filter((item) => {
      const matchesKeyword = !keyword || [item.name, item.title, item.description].join(' ').toLowerCase().includes(keyword);
      const matchesTheme = !themeValue || item.themes.includes(themeValue);
      return matchesKeyword && matchesTheme;
    });
    renderSkills(filtered);
  };

  search?.addEventListener('input', rerender);
  theme?.addEventListener('change', rerender);
  rerender();
}

function bindHistoryFilters(items) {
  const search = document.getElementById('history-search');
  const theme = document.getElementById('history-theme-filter');
  const status = document.getElementById('history-status-filter');
  populateThemeSelect(theme, items, 'selectedTheme');

  const rerender = () => {
    const keyword = search?.value?.trim().toLowerCase() ?? '';
    const themeValue = theme?.value ?? '';
    const statusValue = status?.value ?? '';
    const filtered = items.filter((item) => {
      const matchesKeyword = !keyword || [item.title, item.content].join(' ').toLowerCase().includes(keyword);
      const matchesTheme = !themeValue || item.selectedTheme === themeValue;
      const matchesStatus = !statusValue || item.status === statusValue;
      return matchesKeyword && matchesTheme && matchesStatus;
    });
    renderHistory(filtered);
  };

  search?.addEventListener('input', rerender);
  theme?.addEventListener('change', rerender);
  status?.addEventListener('change', rerender);
  rerender();
}

const path = window.location.pathname;
const normalizedPath = BASE_PATH ? path.replace(BASE_PATH, '') || '/' : path;
if (normalizedPath === '/' || normalizedPath.endsWith('/index.html')) {
  fetchJson(withBasePath('/api/today')).then(renderToday).catch(console.error);
} else if (normalizedPath.endsWith('/history.html')) {
  fetchJson(withBasePath('/api/history')).then(bindHistoryFilters).catch(console.error);
} else if (normalizedPath.endsWith('/skills.html')) {
  fetchJson(withBasePath('/api/skills')).then(bindSkillFilters).catch(console.error);
} else if (normalizedPath.endsWith('/skill.html')) {
  const name = new URLSearchParams(window.location.search).get('name');
  if (!name) {
    renderSkillDetail(null);
  } else {
    fetchSkillDetail(name).then(renderSkillDetail).catch(() => renderSkillDetail(null));
  }
}
