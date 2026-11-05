import { WM } from './wm.js';
import { api, apps, applySettings, projectView, el, themes, setTheme, curTheme, initTheme } from './apps.js';
import { Term } from './terminal.js';
import { setLive } from './live.js';
import { Launcher } from './launcher.js';
import { boot } from './boot.js';
import './widget.js';
import { Games, Homework, Bin, Snake, Breakout } from './fun.js';

initTheme();
boot();

const A = {
  cv: () => WM.open('cv', { title: 'CV', w: 720, h: 520, render: apps.cv }),
  projects: () => WM.open('projects', { title: 'Projects', w: 820, h: 520, render: apps.projects }),
  cmd: () => WM.open('cmd', { title: 'Terminal', w: 640, h: 400, flush: true, render: (b) => Term(b, A) }),
  games: () => WM.open('games', { title: 'Games', w: 460, h: 300, render: (b) => Games(b, A) }),
  homework: () => WM.open('homework', { title: 'Homework', w: 420, h: 300, render: Homework }),
  bin: () => WM.open('bin', { title: 'Recycle Bin', w: 540, h: 400, render: Bin }),
  snake: () => WM.open('snake', { title: 'Snake', w: 400, h: 450, flush: true, render: Snake }),
  breakout: () => WM.open('breakout', { title: 'Breakout', w: 400, h: 510, flush: true, render: Breakout }),
  project: (p) => WM.open('proj-' + p.id, { title: p.title, w: 700, h: 500, render: (body) => projectView(p, body) }),
};

// Desktop icons: double-click on mouse, single tap on touch.
const touch = matchMedia('(pointer:coarse)').matches;
const bind = (btn, fn) => {
  btn.addEventListener(touch ? 'click' : 'dblclick', fn);
  btn.addEventListener('keydown', (e) => e.key === 'Enter' && fn());
};
document.querySelectorAll('.icon').forEach((b) => bind(b, () => A[b.dataset.app]()));

// One desktop icon per project (icon = emoji/letters or an uploaded image; label defaults to the title).
const box = document.querySelector('.icons');
let plist = [];
async function renderProjectIcons() {
  plist = await api('/projects').catch(() => []);
  box.querySelectorAll('.icon.proj').forEach((x) => x.remove());
  plist.forEach((p) => {
    const label = p.label || p.title, img = /^img\//.test(p.icon || '');
    const glyph = el('b', {});
    if (img) glyph.append(el('img', { src: p.icon, alt: '' }));
    else {
      glyph.textContent = p.icon || label.slice(0, 2).toUpperCase();
      if (/\p{Extended_Pictographic}/u.test(p.icon || '')) glyph.className = 'emo';
    }
    const btn = el('button', { className: 'icon proj', title: p.title }, glyph, label);
    bind(btn, () => A.project(p));
    box.append(btn);
  });
}
document.addEventListener('projects-changed', renderProjectIcons);
renderProjectIcons();

// Launcher: Ctrl+K, tap the Meta/Super key (where the OS lets the page see it), or the Applications button.
const L = Launcher(() => [
  { label: 'Resume', hint: 'app', run: A.cv },
  { label: 'Projects', hint: 'app', run: A.projects },
  { label: 'Terminal', hint: 'app', run: A.cmd },
  { label: 'Games', hint: 'folder', run: A.games },
  { label: 'Snake', hint: 'game', run: A.snake },
  { label: 'Breakout', hint: 'game', run: A.breakout },
  { label: 'Homework', hint: 'folder', run: A.homework },
  { label: 'Recycle Bin', hint: 'folder', run: A.bin },
  ...plist.map((p) => ({ label: p.label || p.title, hint: 'project', run: () => A.project(p) })),
  ...themes.map((t) => ({ label: 'Theme: ' + t, hint: 'theme', run: () => setTheme(t) })),
  ...['stars', 'rain', 'off'].map((m) => ({ label: 'Wallpaper: ' + m, hint: 'wallpaper', run: () => setLive({ mode: m }) })),
]);
document.getElementById('start').onclick = (e) => { e.stopPropagation(); L.toggle(); };
let metaDown = false;
addEventListener('keydown', (e) => {
  metaDown = e.key === 'Meta';
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 'k') { e.preventDefault(); L.toggle(); }
  else if ((e.ctrlKey && e.key === '`') || (e.ctrlKey && e.altKey && k === 't')) { e.preventDefault(); A.cmd(); }
});
addEventListener('keyup', (e) => { if (e.key === 'Meta' && metaDown) L.toggle(); });

document.getElementById('themebtn').onclick = () => setTheme(themes[(themes.indexOf(curTheme()) + 1) % themes.length]);

const clock = document.getElementById('clock');
const tick = () => { clock.textContent = new Date().toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' }); };
tick(); setInterval(tick, 15000);

// Taskbar social links come from data/settings.json.
function renderSocials(list) {
  const tray = document.getElementById('tray');
  tray.replaceChildren(...list.filter((x) => /^(https?:|mailto:)/i.test(x.url || '')).map((x) => {
    const a = el('a', { href: x.url, title: x.title || '', textContent: x.text || x.title || '•' });
    if (x.url.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener'; }
    return a;
  }));
}
api('/settings').then((s) => { applySettings(s); renderSocials(s.socials || []); }).catch(() => {});
