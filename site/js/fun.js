// Desktop jokes: Games folder (Snake, Breakout), an empty Homework folder, and a Recycle Bin with history.
// Edit the arrays below to change the jokes.
import { el } from './apps.js';

const touch = matchMedia('(pointer:coarse)').matches;
const launch = (btn, fn) => { btn.addEventListener(touch ? 'click' : 'dblclick', fn); btn.addEventListener('keydown', (e) => e.key === 'Enter' && fn()); };
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const best = {
  get: (k) => { try { return +localStorage.getItem(k) || 0; } catch { return 0; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};
const file = (icon, name) => el('button', { className: 'file' }, el('b', { textContent: icon }), name);
const statusBar = (t = '') => el('div', { className: 'statusbar', textContent: t });
const active = (body) => !document.hidden && body.closest('.win')?.classList.contains('act');
const banner = (cx, W, H, msg) => {
  cx.font = '14px system-ui'; cx.textAlign = 'center';
  const w = cx.measureText(msg).width + 28;
  cx.fillStyle = 'rgba(0,0,0,.65)'; cx.fillRect((W - w) / 2, H / 2 - 16, w, 32);
  cx.fillStyle = '#fff'; cx.fillText(msg, W / 2, H / 2 + 5);
};

// ---------- folders
export function Games(body, A) {
  const f = (icon, name, fn) => { const b = file(icon, name); launch(b, fn); return b; };
  body.replaceChildren(el('div', { className: 'files' }, f('🐍', 'snake.exe', A.snake), f('🧱', 'breakout.exe', A.breakout)),
    statusBar(touch ? 'Tap a file to run it' : 'Double-click a file to run it'));
}

const HW = ['0 items. Suspiciously clean.', 'Due: yesterday.', 'The dog did not eat it either.', 'Have you checked the Recycle Bin?', 'Still empty.'];
export function Homework(body) {
  let i = 0; const bar = statusBar(HW[0]);
  const empty = el('div', { className: 'empty' }, el('div', {}, el('div', { className: 'bigicon', textContent: '📂' }), 'This folder is empty.'));
  empty.onclick = () => { i = (i + 1) % HW.length; bar.textContent = HW[i]; };
  body.replaceChildren(empty, bar);
}

// [icon, name, size, why it is here, what happens on Restore]
const BIN = [
  ['📄', 'typst.exe', '14 MB', 'Deleted by the LaTeX loyalists.', 'Restore failed: LaTeX is watching.'],
  ['📚', 'homework.pdf', '0 KB', 'Moved here. Not done. Just moved.', 'Restore blocked: the Homework folder prefers to stay empty.'],
  ['📦', 'node_modules', '2.3 GB', 'Deleted "for a clean install".', 'Restoring 184,302 files... never mind.'],
  ['📝', 'final_FINAL_v7_REAL.docx', '38 KB', 'Deleted by version control.', 'Which one? There are seven.'],
  ['🧠', 'motivation.zip', '1 KB', 'Deleted by Monday.', 'Archive appears to be empty.'],
  ['🔧', 'missing_semicolon.js', '1 KB', 'Found after three hours.', 'Restored. Now it is a different semicolon.'],
  ['😴', 'sleep_schedule.cfg', '4 KB', 'Deleted by deadlines.', 'Permission denied.'],
];
const EMPTY = ['Cannot empty the bin: typst.exe is still pending a vote.', 'Are you sure? Some of this is load-bearing.', 'Emptying... 3%... 3%... 3%... cancelled.'];
export function Bin(body) {
  let sel = -1, n = 0;
  const bar = statusBar(`${BIN.length} items. Click one for details.`), files = el('div', { className: 'files' });
  const draw = () => files.replaceChildren(...BIN.map((it, i) => {
    const b = file(it[0], it[1]); if (i === sel) b.classList.add('on');
    b.onclick = () => { sel = i; bar.textContent = `${it[1]} (${it[2]}). ${it[3]}`; draw(); };
    return b;
  }));
  const tools = el('div', { className: 'tools' },
    el('button', { className: 'btn', textContent: 'Restore', onclick: () => { bar.textContent = sel < 0 ? 'Select something to restore first.' : BIN[sel][4]; } }),
    el('button', { className: 'btn', textContent: 'Empty Recycle Bin', onclick: () => { bar.textContent = EMPTY[n++ % EMPTY.length]; } }));
  draw(); body.replaceChildren(tools, files, bar);
}

// ---------- Snake (arrows/WASD or swipe; walls wrap)
export function Snake(body) {
  const N = 20, S = 18, KEY = 'best-snake';
  const cv = el('canvas', { width: N * S, height: N * S }), cx = cv.getContext('2d');
  const hud = el('div', { className: 'hud' }), a = el('span'), b = el('span');
  hud.append(a, b); body.replaceChildren(el('div', { className: 'game' }, hud, cv));
  let snake, dir, nd, food, score, dead, go = false, hi = best.get(KEY);
  const drop = () => { do food = { x: (Math.random() * N) | 0, y: (Math.random() * N) | 0 }; while (snake.some((s) => s.x === food.x && s.y === food.y)); };
  const reset = () => { snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]; dir = nd = { x: 1, y: 0 }; score = 0; dead = false; go = false; drop(); };
  const turn = (x, y) => { go = true; if (x !== -dir.x || y !== -dir.y) nd = { x, y }; };
  const step = () => {
    dir = nd;
    const h = { x: (snake[0].x + dir.x + N) % N, y: (snake[0].y + dir.y + N) % N };
    if (snake.slice(0, -1).some((s) => s.x === h.x && s.y === h.y)) { dead = true; if (score > hi) { hi = score; best.set(KEY, hi); } return; }
    snake.unshift(h);
    if (h.x === food.x && h.y === food.y) { score++; drop(); } else snake.pop();
  };
  const draw = (on) => {
    cx.fillStyle = css('--panel'); cx.fillRect(0, 0, cv.width, cv.height);
    cx.fillStyle = css('--accent'); cx.fillRect(food.x * S + 3, food.y * S + 3, S - 6, S - 6);
    cx.fillStyle = css('--fg');
    snake.forEach((s, i) => { cx.globalAlpha = i ? 0.8 : 1; cx.fillRect(s.x * S + 1, s.y * S + 1, S - 2, S - 2); });
    cx.globalAlpha = 1; a.textContent = `Score ${score}`; b.textContent = `Best ${hi}`;
    const msg = dead ? 'Game over. Click or press Space' : !on ? 'Click to play' : !go ? 'Arrow keys or swipe to start' : '';
    if (msg) banner(cx, cv.width, cv.height, msg);
  };
  const KEYS = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
  const onKey = (e) => {
    if (!body.isConnected) return removeEventListener('keydown', onKey);
    if (!active(body)) return;
    const k = KEYS[e.key.toLowerCase()];
    if (k) { turn(...k); e.preventDefault(); } else if (e.key === ' ' && dead) { reset(); e.preventDefault(); }
  };
  let p0;
  cv.onpointerdown = (e) => { p0 = [e.clientX, e.clientY]; if (dead) reset(); };
  cv.onpointerup = (e) => {
    if (!p0) return;
    const dx = e.clientX - p0[0], dy = e.clientY - p0[1]; p0 = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    Math.abs(dx) > Math.abs(dy) ? turn(Math.sign(dx), 0) : turn(0, Math.sign(dy));
  };
  reset(); addEventListener('keydown', onKey);
  const t = setInterval(() => {
    if (!body.isConnected) { clearInterval(t); removeEventListener('keydown', onKey); return; }
    const on = active(body);
    if (on && go && !dead) step();
    draw(on);
  }, 110);
}

// ---------- Breakout (mouse/touch or arrows; click or Space to launch)
export function Breakout(body) {
  const W = 360, H = 420, COLS = 8, ROWS = 5, BW = W / COLS, BH = 18, TOP = 34, PW = 72, KEY = 'best-breakout';
  const cv = el('canvas', { width: W, height: H }), cx = cv.getContext('2d');
  const hud = el('div', { className: 'hud' }), a = el('span'), b = el('span');
  hud.append(a, b); body.replaceChildren(el('div', { className: 'game' }, hud, cv));
  let bricks, px, ball, lives, score, state, last = 0, hi = best.get(KEY);
  const keys = {};
  const remember = () => { if (score > hi) { hi = score; best.set(KEY, hi); } };
  const serve = () => { ball = { x: px + PW / 2, y: H - 30, vx: 0, vy: 0 }; state = 'ready'; };
  const reset = () => { bricks = Array(ROWS * COLS).fill(1); px = (W - PW) / 2; lives = 3; score = 0; serve(); };
  const launchBall = () => {
    if (state === 'ready') { ball.vx = (Math.random() < 0.5 ? -1 : 1) * 2.4; ball.vy = -3.6; state = 'play'; }
    else if (state === 'over' || state === 'win') reset();
  };
  const update = (k) => {
    px = Math.max(0, Math.min(W - PW, px + ((keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0)) * 6 * k));
    if (state === 'ready') { ball.x = px + PW / 2; return; }
    if (state !== 'play') return;
    ball.x += ball.vx * k; ball.y += ball.vy * k;
    if (ball.x < 5 || ball.x > W - 5) { ball.vx *= -1; ball.x = Math.max(5, Math.min(W - 5, ball.x)); }
    if (ball.y < 5) ball.vy = Math.abs(ball.vy);
    if (ball.vy > 0 && ball.y > H - 22 && ball.y < H - 10 && ball.x > px - 4 && ball.x < px + PW + 4) {
      ball.vy = -Math.abs(ball.vy); ball.vx = ((ball.x - (px + PW / 2)) / (PW / 2)) * 4;
    }
    const c = (ball.x / BW) | 0, r = ((ball.y - TOP) / BH) | 0;
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS && bricks[r * COLS + c]) {
      bricks[r * COLS + c] = 0; ball.vy *= -1.01; score += 10;
      if (!bricks.some(Boolean)) { state = 'win'; remember(); }
    }
    if (ball.y > H) { lives--; if (lives) serve(); else { state = 'over'; remember(); } }
  };
  const draw = (on) => {
    cx.fillStyle = css('--panel'); cx.fillRect(0, 0, W, H);
    cx.fillStyle = css('--accent');
    bricks.forEach((v, i) => {
      if (!v) return;
      const row = (i / COLS) | 0;
      cx.globalAlpha = 1 - row * 0.15; cx.fillRect((i % COLS) * BW + 1, TOP + row * BH + 1, BW - 2, BH - 2);
    });
    cx.globalAlpha = 1; cx.fillStyle = css('--fg');
    cx.fillRect(px, H - 20, PW, 8); cx.beginPath(); cx.arc(ball.x, ball.y, 5, 0, 7); cx.fill();
    a.textContent = `Score ${score}  ${'♥'.repeat(lives)}`; b.textContent = `Best ${hi}`;
    const msg = !on ? 'Click to play' : state === 'ready' ? 'Mouse or arrows to move. Click to launch' : state === 'over' ? 'Game over. Click to retry' : state === 'win' ? 'Wall cleared! Click to replay' : '';
    if (msg) banner(cx, W, H, msg);
  };
  const onKey = (e) => {
    if (!body.isConnected || !active(body)) return;
    if (e.key === ' ') { launchBall(); e.preventDefault(); }
    else if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) { keys[e.key] = true; e.preventDefault(); }
  };
  const onUp = (e) => { delete keys[e.key]; };
  cv.onpointermove = (e) => { const r = cv.getBoundingClientRect(); px = Math.max(0, Math.min(W - PW, ((e.clientX - r.left) * W) / r.width - PW / 2)); };
  cv.onpointerdown = (e) => { cv.onpointermove(e); launchBall(); };
  const loop = (t) => {
    if (!body.isConnected) { removeEventListener('keydown', onKey); removeEventListener('keyup', onUp); return; }
    const on = active(body), k = Math.min(2, (t - last) / 16.67 || 1); last = t;
    if (on) update(k);
    draw(on); requestAnimationFrame(loop);
  };
  reset(); addEventListener('keydown', onKey); addEventListener('keyup', onUp); requestAnimationFrame(loop);
}
