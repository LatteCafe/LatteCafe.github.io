// Desktop clock widget: three rings (seconds, minutes, hours), date, and day/week/year progress.
import { WM } from './wm.js';
const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');
const ring = (id, p) => $(id).setAttribute('stroke-dasharray', `${Math.max(0.01, p * 100).toFixed(2)} 100`);
const bar = (id, p) => { $(id).style.width = (p * 100).toFixed(1) + '%'; $(id).parentElement.title = Math.round(p * 100) + '%'; };

function tick() {
  const d = new Date(), s = d.getSeconds() + d.getMilliseconds() / 1000, m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
  ring('r-s', s / 60); ring('r-m', m / 60); ring('r-h', h / 12);
  $('w-time').textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  $('w-sec').textContent = pad(d.getSeconds());
  $('w-day').textContent = d.toLocaleDateString([], { weekday: 'long' });
  $('w-date').textContent = d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
  const day = (d.getHours() * 3600 + d.getMinutes() * 60 + s) / 86400;
  const y = d.getFullYear();
  bar('b-day', day);
  bar('b-week', (((d.getDay() + 6) % 7) + day) / 7);
  bar('b-year', (d - new Date(y, 0, 1)) / (new Date(y + 1, 0, 1) - new Date(y, 0, 1)));
}
tick(); setInterval(tick, 100);
const w = $('clockw'); WM.drag(w, w, false); // draggable, like a Rainmeter skin
