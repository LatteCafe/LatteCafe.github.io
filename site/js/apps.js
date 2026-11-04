import { setLive } from './live.js';
// API helper + CV, Projects and Admin windows. All DOM is built with textContent (no innerHTML => no XSS).
const FILES = { '/projects': 'data/projects.json', '/resume': 'data/resume.json', '/settings': 'data/settings.json' };
export const api = async (p) => {
  const r = await fetch(FILES[p]);
  if (!r.ok) throw new Error('Could not load ' + FILES[p]);
  return r.json();
};

export const el = (t, p = {}, ...k) => { const e = Object.assign(document.createElement(t), p); e.append(...k); return e; };

export const themes = ['default', 'nord', 'gruvbox', 'dracula', 'catppuccin'];
let S = {};
const root = document.documentElement;
export const curTheme = () => root.dataset.theme || 'default';
export function setTheme(n, save = true) {
  if (!themes.includes(n)) return false;
  root.dataset.theme = n;
  if (save) try { localStorage.setItem('theme', n); } catch {}
  // The admin's custom colors only apply to the default theme.
  if (n === 'default' && S.accent) { root.style.setProperty('--accent', S.accent); root.style.setProperty('--bg', S.bg); }
  else { root.style.removeProperty('--accent'); root.style.removeProperty('--bg'); }
  return true;
}
export function initTheme() { let t = null; try { t = localStorage.getItem('theme'); } catch {} setTheme(t || 'default', false); }
export function applySettings(s) {
  S = s; setTheme(curTheme(), false);
  document.getElementById('desktop').style.backgroundImage = s.wallpaper ? `url("${s.wallpaper}")` : 'none';
  setLive({ image: !!s.wallpaper });
}

async function cv(b) {
  const r = await api('/resume');
  b.replaceChildren(
    el('h1', { textContent: r.name }),
    el('div', { className: 'mut', textContent: r.title }),
    el('p', { textContent: r.summary }),
    el('p', { className: 'mut', textContent: [r.email, r.location].filter(Boolean).join(' | ') }),
    ...(r.sections || []).map((s) => el('details', { open: true },
      el('summary', { textContent: s.heading }),
      ...(s.items || []).map((i) => el('article', {},
        el('h3', { textContent: i.title }),
        el('div', { className: 'mut', textContent: [i.sub, i.date].filter(Boolean).join(' | ') }),
        el('p', { textContent: i.text || '' })))))
  );
}

export function projectView(p, main) {
  const big = el('img', { className: 'shot', alt: p.title, src: p.images[0] || '' });
  big.hidden = !p.images[0];
  main.replaceChildren(
    big,
    el('div', { className: 'thumbs' }, ...p.images.map((u) => {
      const t = el('img', { src: u, alt: '', loading: 'lazy' });
      t.onclick = () => { big.src = u; big.hidden = false; };
      return t;
    })),
    el('h2', { textContent: p.title }),
    el('div', { className: 'tags' }, ...p.tags.map((t) => el('span', { className: 'tag', textContent: t }))),
    el('p', { className: 'desc', textContent: p.description }),
    el('div', { className: 'links' }, ...[['Live demo', p.live_url], ['Source', p.repo_url]]
      .filter((x) => x[1]).map(([t, u]) => el('a', { href: u, target: '_blank', rel: 'noopener', textContent: t })))
  );
}

async function projects(b) {
  const list = await api('/projects');
  const side = el('ul', { className: 'plist' }), main = el('div');
  const show = (p, btn) => {
    side.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === btn));
    projectView(p, main);
  };
  list.forEach((p) => {
    const btn = el('button', { textContent: p.title });
    btn.onclick = () => show(p, btn);
    side.append(el('li', {}, btn));
  });
  b.replaceChildren(el('div', { className: 'split' }, side, main));
  if (list[0]) show(list[0], side.querySelector('button'));
  else main.textContent = 'No projects yet.';
}

export const apps = { cv, projects };
