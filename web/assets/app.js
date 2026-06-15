const THEME_LABELS = {
  'high-frequency-productivity': '高频提效',
  'setup-workflow': '配置 / 工作流',
  'official-high-value': '官方高价值',
  'team-collaboration': '团队协作',
  'learning-path': '学习路径',
};

const STATUS_LABELS = {
  success: '已推送',
  failed: '失败',
  skipped: '已跳过',
};

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

function themeLabel(value) {
  return THEME_LABELS[value] ?? value ?? '未分配';
}

function statusLabel(value) {
  return STATUS_LABELS[value] ?? value;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}`);
  return response.json();
}

function badge(label, href, className = '') {
  const classAttr = ['badge', className].filter(Boolean).join(' ');
  if (href) {
    return `<a class="${classAttr} badge-link" href="${href}">${label}</a>`;
  }
  return `<span class="${classAttr}">${label}</span>`;
}

function renderActiveFilters(el, chips) {
  if (!el) return;
  if (chips.length === 0) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = chips.map((chip) => badge(chip.label)).join('');
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
        ${badge(themeLabel(data.selectedTheme), `./skills.html?theme=${encodeURIComponent(data.selectedTheme ?? '')}`, 'theme-badge')}
        ${data.selectedSkill.isOfficialNoteworthy ? badge('官方值得关注', './skills.html?official=noteworthy') : ''}
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
      <div class="badge-group">${data.selectedSkill.themes.map((theme) => badge(themeLabel(theme), `./skills.html?theme=${encodeURIComponent(theme)}`, 'theme-badge')).join('')}</div>
      <div class="link-stack">
        <p class="link-row"><a href="./skill.html?name=${encodeURIComponent(data.selectedSkill.name)}">查看技能详情 →</a></p>
        <p class="link-row"><a href="./skills.html?theme=${encodeURIComponent(data.selectedTheme ?? '')}">查看更多同主题技能 →</a></p>
        <p class="link-row"><a href="${data.selectedSkill.links[0]?.url ?? '#'}" target="_blank" rel="noreferrer">查看官方文档 →</a></p>
      </div>
    </section>
  `;
}

function renderSpotlight(items, selectedSkillName) {
  const el = document.getElementById('spotlight-list');
  const empty = document.getElementById('spotlight-empty');
  if (!el) return;

  const spotlight = items
    .filter((item) => item.name !== selectedSkillName)
    .filter((item) => item.isOfficialRecent || item.isOfficialNoteworthy)
    .slice(0, 4);

  el.innerHTML = spotlight.map((item) => `
    <article class="card spotlight-card">
      <div class="card-header">
        <h2>${item.title}</h2>
        <div class="badge-group">
          ${item.isOfficialRecent ? badge('官方近期', `./skills.html?official=recent`) : ''}
          ${item.isOfficialNoteworthy ? badge('官方值得关注', `./skills.html?official=noteworthy`) : ''}
        </div>
      </div>
      <p class="lead">${item.description}</p>
      <p class="meta">主题：${item.themes.map((theme) => themeLabel(theme)).join(' / ')}</p>
      <p class="link-row"><a href="./skill.html?name=${encodeURIComponent(item.name)}">查看技能详情 →</a></p>
    </article>
  `).join('');

  if (empty) empty.hidden = spotlight.length > 0;
}

function groupHistoryByDate(items) {
  const groups = new Map();
  for (const item of items) {
    const list = groups.get(item.date) ?? [];
    list.push(item);
    groups.set(item.date, list);
  }
  return Array.from(groups.entries());
}

function renderHistory(items) {
  const el = document.getElementById('history-list');
  const empty = document.getElementById('history-empty');
  const count = document.getElementById('history-result-count');
  if (!el) return;

  const groups = groupHistoryByDate(items);
  el.innerHTML = groups.map(([date, entries]) => `
    <section class="history-group">
      <div class="group-heading">
        <h2>${date}</h2>
        <p class="meta">共 ${entries.length} 条记录</p>
      </div>
      <div class="list history-group-list">
        ${entries.map((item) => `
          <article class="card history-card">
            <div class="card-header">
              <div>
                <h2>${item.title}</h2>
                <p class="meta">${item.date}</p>
              </div>
              <div class="badge-group">
                ${badge(themeLabel(item.displayTheme), item.displayTheme ? `./history.html?theme=${encodeURIComponent(item.displayTheme)}` : '', 'theme-badge')}
                ${badge(statusLabel(item.status), `./history.html?status=${encodeURIComponent(item.status)}`, `status-${item.status}`)}
              </div>
            </div>
            <p class="meta">本次推送主题：${themeLabel(item.displayTheme)}</p>
            <pre>${item.content}</pre>
          </article>
        `).join('')}
      </div>
    </section>
  `).join('');

  if (empty) empty.hidden = items.length > 0;
  if (count) count.textContent = `筛选后 ${items.length} 条结果`;
}

function renderSkills(items) {
  const el = document.getElementById('skills-list');
  const empty = document.getElementById('skills-empty');
  const count = document.getElementById('skills-result-count');
  if (!el) return;
  el.innerHTML = items.map((item) => `
    <article class="card skill-card">
      <div class="card-header">
        <h2>${item.title}</h2>
        <div class="badge-group">
          ${item.themes.map((theme) => badge(themeLabel(theme), `./skills.html?theme=${encodeURIComponent(theme)}`, 'theme-badge')).join('')}
          ${item.isOfficialRecent ? badge('官方近期', './skills.html?official=recent') : ''}
          ${item.isOfficialNoteworthy ? badge('官方值得关注', './skills.html?official=noteworthy') : ''}
        </div>
      </div>
      <p class="lead">${item.description}</p>
      <div class="badge-group compact-badges">
        ${badge(item.difficulty, `./skills.html?difficulty=${encodeURIComponent(item.difficulty)}`)}
        ${item.tags.slice(0, 3).map((tag) => badge(tag, `./skills.html?tag=${encodeURIComponent(tag)}`)).join('')}
      </div>
      <p class="meta">分类：${item.category.join(' / ')}</p>
      <div class="link-stack">
        <p class="link-row"><a href="./skill.html?name=${encodeURIComponent(item.name)}">查看技能详情 →</a></p>
        <p class="link-row"><a href="${item.links[0]?.url ?? '#'}" target="_blank" rel="noreferrer">查看官方文档 →</a></p>
      </div>
    </article>
  `).join('');
  if (empty) empty.hidden = items.length > 0;
  if (count) count.textContent = `筛选后 ${items.length} 个技能`;
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
        ${skill.themes.map((theme) => badge(themeLabel(theme), `./skills.html?theme=${encodeURIComponent(theme)}`, 'theme-badge')).join('')}
        ${skill.isOfficialRecent ? badge('官方近期', './skills.html?official=recent') : ''}
        ${skill.isOfficialNoteworthy ? badge('官方值得关注', './skills.html?official=noteworthy') : ''}
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
        <div class="badge-group compact-badges">
          ${badge(skill.difficulty, `./skills.html?difficulty=${encodeURIComponent(skill.difficulty)}`)}
          ${skill.tags.map((tag) => badge(tag, `./skills.html?tag=${encodeURIComponent(tag)}`)).join('')}
        </div>
        <p class="meta">分类：${skill.category.join(' / ')}</p>
      </div>
    </section>
    <section class="section-block split-grid">
      <div>
        <h3>相关技能</h3>
        <div class="badge-group">${(skill.relatedSkills ?? []).map((item) => badge(item, `./skill.html?name=${encodeURIComponent(item)}`, 'theme-badge')).join('') || '<span class="meta">暂无</span>'}</div>
      </div>
      <div>
        <h3>使用入口</h3>
        <div class="link-stack">${skill.links.map((link) => `<p class="link-row"><a href="${link.url}" target="_blank" rel="noreferrer">${link.label} →</a></p>`).join('')}</div>
      </div>
    </section>
  `;
}

function populateSelect(select, items, extractor, placeholder = '全部', formatter = (value) => value) {
  if (!select) return;
  const values = new Set();
  items.forEach((item) => {
    const raw = extractor(item);
    if (Array.isArray(raw)) raw.forEach((value) => value && values.add(value));
    else if (raw) values.add(raw);
  });
  const current = select.value;
  select.innerHTML = `<option value="">${placeholder}</option>${Array.from(values).sort().map((value) => `<option value="${value}">${formatter(value)}</option>`).join('')}`;
  select.value = current;
}

function bindSkillFilters(items) {
  const params = new URLSearchParams(window.location.search);
  const search = document.getElementById('skills-search');
  const theme = document.getElementById('skills-theme-filter');
  const difficulty = document.getElementById('skills-difficulty-filter');
  const active = document.getElementById('skills-active-filters');

  populateSelect(theme, items, (item) => item.themes, '全部主题', themeLabel);
  populateSelect(difficulty, items, (item) => item.difficulty, '全部难度');

  if (search && params.get('q')) search.value = params.get('q');
  if (theme && params.get('theme')) theme.value = params.get('theme');
  if (difficulty && params.get('difficulty')) difficulty.value = params.get('difficulty');

  const rerender = () => {
    const keyword = search?.value?.trim().toLowerCase() ?? '';
    const themeValue = theme?.value ?? '';
    const difficultyValue = difficulty?.value ?? '';
    const tagValue = params.get('tag') ?? '';
    const officialValue = params.get('official') ?? '';

    const filtered = items.filter((item) => {
      const matchesKeyword = !keyword || [item.name, item.title, item.description].join(' ').toLowerCase().includes(keyword);
      const matchesTheme = !themeValue || item.themes.includes(themeValue);
      const matchesDifficulty = !difficultyValue || item.difficulty === difficultyValue;
      const matchesTag = !tagValue || item.tags.includes(tagValue);
      const matchesOfficial = !officialValue || (officialValue === 'recent' ? item.isOfficialRecent : item.isOfficialNoteworthy);
      return matchesKeyword && matchesTheme && matchesDifficulty && matchesTag && matchesOfficial;
    });

    const chips = [];
    if (keyword) chips.push({ label: `搜索：${keyword}` });
    if (themeValue) chips.push({ label: `主题：${themeLabel(themeValue)}` });
    if (difficultyValue) chips.push({ label: `难度：${difficultyValue}` });
    if (tagValue) chips.push({ label: `标签：${tagValue}` });
    if (officialValue) chips.push({ label: officialValue === 'recent' ? '官方近期' : '官方值得关注' });
    renderActiveFilters(active, chips);
    renderSkills(filtered);
  };

  search?.addEventListener('input', rerender);
  theme?.addEventListener('change', rerender);
  difficulty?.addEventListener('change', rerender);
  rerender();
}

function bindHistoryFilters(items) {
  const params = new URLSearchParams(window.location.search);
  const search = document.getElementById('history-search');
  const theme = document.getElementById('history-theme-filter');
  const status = document.getElementById('history-status-filter');
  const active = document.getElementById('history-active-filters');

  populateSelect(theme, items, (item) => item.displayTheme, '全部主题', themeLabel);

  if (search && params.get('q')) search.value = params.get('q');
  if (theme && params.get('theme')) theme.value = params.get('theme');
  if (status && params.get('status')) status.value = params.get('status');

  const rerender = () => {
    const keyword = search?.value?.trim().toLowerCase() ?? '';
    const themeValue = theme?.value ?? '';
    const statusValue = status?.value ?? '';
    const filtered = items.filter((item) => {
      const matchesKeyword = !keyword || [item.title, item.content].join(' ').toLowerCase().includes(keyword);
      const matchesTheme = !themeValue || item.displayTheme === themeValue;
      const matchesStatus = !statusValue || item.status === statusValue;
      return matchesKeyword && matchesTheme && matchesStatus;
    });

    const chips = [];
    if (keyword) chips.push({ label: `搜索：${keyword}` });
    if (themeValue) chips.push({ label: `主题：${themeLabel(themeValue)}` });
    if (statusValue) chips.push({ label: `状态：${statusLabel(statusValue)}` });
    renderActiveFilters(active, chips);
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
  fetchJson(withBasePath('/api/today'))
    .then(async (today) => {
      renderToday(today);
      const skills = await fetchJson(withBasePath('/api/skills'));
      renderSpotlight(skills, today.selectedSkill.name);
    })
    .catch(console.error);
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
