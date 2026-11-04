const $ = (s) => document.querySelector(s);
const el = (t, p = {}, ...k) => { const e = Object.assign(document.createElement(t), p); e.append(...k); return e; };
const isImg = (v) => /^img\//.test(v || '');
let data, tab = 'projects', cur = 0, isDirty = false;

const status = (m, bad) => { const s = $('#status'); s.textContent = m; s.className = bad ? 'bad' : ''; };
const dirty = () => { isDirty = true; status('Unsaved changes'); };
addEventListener('beforeunload', (e) => { if (isDirty) e.preventDefault(); });

const api = async (method, path, body, form) => {
  const r = await fetch('/api' + path, { method, headers: { 'X-Editor': '1', ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: form || (body && JSON.stringify(body)) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || r.statusText);
  return d;
};
const upload = async (file, kind) => { const fd = new FormData(); fd.append('kind', kind); fd.append('file', file); return (await api('POST', '/upload', null, fd)).path; };

const field = (label, obj, key, { area = false, ph = '' } = {}) => {
  const i = el(area ? 'textarea' : 'input', { value: obj[key] || '', placeholder: ph });
  i.oninput = () => { obj[key] = i.value; dirty(); };
  return el('label', { className: 'f' }, el('span', { textContent: label }), i);
};
const move = (a, i, d) => { const j = i + d; if (j < 0 || j >= a.length) return false; [a[i], a[j]] = [a[j], a[i]]; return true; };
const bar = (a, i) => el('div', { className: 'bar' },
  el('button', { className: 'mini', textContent: '▲', title: 'Move up', onclick: () => move(a, i, -1) && (dirty(), render()) }),
  el('button', { className: 'mini', textContent: '▼', title: 'Move down', onclick: () => move(a, i, 1) && (dirty(), render()) }),
  el('button', { className: 'mini', textContent: '✕', title: 'Remove', onclick: () => { a.splice(i, 1); dirty(); render(); } }));
const add = (label, fn) => el('button', { className: 'btn', textContent: label, onclick: () => { fn(); dirty(); render(); } });

// ---------- projects
function iconField(p) {
  const prev = el('span', { className: 'ico' });
  const paint = () => prev.replaceChildren(isImg(p.icon) ? el('img', { src: p.icon }) : (p.icon || (p.label || p.title || '?').slice(0, 2).toUpperCase()));
  const t = el('input', { value: isImg(p.icon) ? '' : p.icon || '', placeholder: 'emoji or 1-3 letters' });
  t.oninput = () => { p.icon = t.value; paint(); dirty(); };
  const f = el('input', { type: 'file', accept: 'image/*', title: 'Or upload an icon image' });
  f.onchange = async () => { try { p.icon = await upload(f.files[0], 'icon'); t.value = ''; paint(); dirty(); } catch (e) { status(e.message, true); } };
  paint();
  return el('div', { className: 'f' }, el('span', { textContent: 'Desktop icon (emoji, letters, or an uploaded image)' }), el('div', { className: 'iconrow' }, prev, t, f));
}
function imagesField(p) {
  const grid = el('div', { className: 'thumbs' });
  const draw = () => grid.replaceChildren(...p.images.map((u, i) => el('div', { className: 't' }, el('img', { src: u }),
    el('button', { className: 'mini', textContent: '★', title: 'Make cover', onclick: () => { p.images.unshift(p.images.splice(i, 1)[0]); dirty(); draw(); } }),
    el('button', { className: 'mini', textContent: '✕', title: 'Remove', onclick: () => { p.images.splice(i, 1); dirty(); draw(); } }))));
  const f = el('input', { type: 'file', accept: 'image/*', multiple: true });
  f.onchange = async () => {
    for (const x of f.files) { try { p.images.push(await upload(x, 'project')); } catch (e) { return status(e.message, true); } }
    f.value = ''; dirty(); draw();
  };
  draw();
  return el('div', { className: 'f' }, el('span', { textContent: 'Screenshots (the first is the cover)' }), f, grid);
}
function projectsTab() {
  const list = data.projects, p = list[cur];
  const side = el('div', { className: 'side' },
    el('button', { className: 'btn pri', textContent: '+ New project', onclick: () => {
      list.push({ id: null, title: 'New project', label: '', icon: '', description: '', tags: [], live_url: '', repo_url: '', images: [] });
      cur = list.length - 1; dirty(); render();
    } }),
    ...list.map((q, i) => el('div', { className: 'row' + (i === cur ? ' on' : '') },
      el('button', { className: 'pick', textContent: q.label || q.title || 'Untitled', onclick: () => { cur = i; render(); } }),
      el('button', { className: 'mini', textContent: '▲', onclick: () => { if (move(list, i, -1)) { cur = i - 1; dirty(); render(); } } }),
      el('button', { className: 'mini', textContent: '▼', onclick: () => { if (move(list, i, 1)) { cur = i + 1; dirty(); render(); } } }),
      el('button', { className: 'mini', textContent: '✕', onclick: () => {
        if (confirm(`Delete "${q.title}"?`)) { list.splice(i, 1); cur = Math.max(0, Math.min(cur, list.length - 1)); dirty(); render(); }
      } }))));
  if (!p) return el('div', { className: 'split' }, side, el('p', { className: 'hint', textContent: 'No projects yet. Click "+ New project".' }));
  const tags = el('input', { value: (p.tags || []).join(', '), placeholder: 'react, node, design' });
  tags.oninput = () => { p.tags = tags.value.split(',').map((s) => s.trim()).filter(Boolean); dirty(); };
  p.images ||= [];
  return el('div', { className: 'split' }, side, el('div', {},
    field('Title', p, 'title'), field('Desktop label (defaults to the title)', p, 'label'), iconField(p),
    field('Description', p, 'description', { area: true }),
    el('label', { className: 'f' }, el('span', { textContent: 'Tags (comma separated)' }), tags),
    field('Live demo URL', p, 'live_url', { ph: 'https://...' }), field('Repo URL', p, 'repo_url', { ph: 'https://...' }), imagesField(p)));
}

// ---------- resume
function resumeTab() {
  const r = data.resume; r.sections ||= [];
  return el('div', {}, field('Name', r, 'name'), field('Headline', r, 'title'), field('Summary', r, 'summary', { area: true }),
    field('Email', r, 'email'), field('Location', r, 'location'),
    ...r.sections.map((s, si) => el('fieldset', {}, el('legend', { textContent: s.heading || 'New section' }),
      bar(r.sections, si), field('Section heading', s, 'heading'),
      ...(s.items ||= []).map((it, ii) => el('div', { className: 'item' }, bar(s.items, ii),
        field('Title', it, 'title'), field('Subtitle (company, school...)', it, 'sub'), field('Date', it, 'date'), field('Details', it, 'text', { area: true }))),
      el('div', { className: 'item' }, add('+ Add item', () => s.items.push({ title: '', sub: '', date: '', text: '' }))))),
    add('+ Add section', () => r.sections.push({ heading: '', items: [] })));
}

// ---------- settings
function settingsTab() {
  const s = data.settings; s.socials ||= [];
  const color = (label, key) => {
    const i = el('input', { type: 'color', value: s[key] || '#000000' });
    i.oninput = () => { s[key] = i.value; dirty(); };
    return el('label', { className: 'f' }, el('span', { textContent: label }), i);
  };
  const wp = el('div', { className: 'thumbs' });
  const draw = () => wp.replaceChildren(...(s.wallpaper ? [el('div', { className: 't' }, el('img', { src: s.wallpaper }),
    el('button', { className: 'mini', textContent: '✕', onclick: () => { s.wallpaper = ''; dirty(); draw(); } }))] : []));
  const f = el('input', { type: 'file', accept: 'image/*' });
  f.onchange = async () => { try { s.wallpaper = await upload(f.files[0], 'wallpaper'); dirty(); draw(); } catch (e) { status(e.message, true); } };
  draw();
  return el('div', {}, color('Accent color (default theme)', 'accent'), color('Desktop color (default theme)', 'bg'),
    el('div', { className: 'f' }, el('span', { textContent: 'Wallpaper image (leave empty for the live star wallpaper)' }), f, wp),
    el('h3', { textContent: 'Taskbar links' }),
    ...s.socials.map((x, i) => el('div', { className: 'item' }, bar(s.socials, i),
      field('Short text', x, 'text', { ph: 'GH' }), field('Hover title', x, 'title', { ph: 'GitHub' }),
      field('URL', x, 'url', { ph: 'https://github.com/you  or  mailto:you@example.com' }))),
    add('+ Add link', () => s.socials.push({ text: '', title: '', url: '' })),
    el('h3', { textContent: 'Housekeeping' }),
    el('button', { className: 'btn', textContent: 'Delete unused images', onclick: async () => {
      try { status(`Removed ${(await api('POST', '/cleanup')).removed} unused image(s)`); } catch (e) { status(e.message, true); }
    } }),
    el('p', { className: 'hint', textContent: 'Save first. Images uploaded in the last 10 minutes are never deleted.' }));
}

const TABS = { projects: ['Projects', projectsTab], resume: ['Resume', resumeTab], settings: ['Settings', settingsTab] };
function render() {
  $('#tabs').replaceChildren(...Object.entries(TABS).map(([k, [name]]) =>
    el('button', { className: 'btn' + (k === tab ? ' on' : ''), textContent: name, onclick: () => { tab = k; render(); } })));
  $('#main').replaceChildren(TABS[tab][1]());
}

$('#save').onclick = async () => {
  try {
    data.projects = (await api('PUT', '/projects', { projects: data.projects })).projects;
    data.resume = await api('PUT', '/resume', data.resume);
    data.settings = await api('PUT', '/settings', data.settings);
    cur = Math.max(0, Math.min(cur, data.projects.length - 1));
    isDirty = false; status('Saved ✓  Refresh the preview to see it'); render();
  } catch (e) { status(e.message, true); }
};
api('GET', '/data').then((d) => { data = d; render(); }).catch((e) => { $('#main').textContent = 'Could not load: ' + e.message; });
