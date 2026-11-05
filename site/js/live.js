// Live wallpaper on a canvas: drifting stars or code rain. Hidden when an uploaded wallpaper is set.
const cv = document.getElementById('live'), cx = cv.getContext('2d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let saved = null; try { saved = localStorage.getItem('wp'); } catch {}
let st = { mode: saved || 'stars', image: false };
if (reduce && st.mode === 'rain') st.mode = 'stars';
let W = 0, H = 0, stars = [], cols = [], hearts = [], last = 0;
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const GL = 'アイウエオカキクケコサシスセソ0123456789';

function init() {
  W = cv.width = cv.clientWidth; H = cv.height = cv.clientHeight;
  stars = Array.from({ length: Math.round((W * H) / 9000) }, () => ({ x: Math.random() * W, y: Math.random() * H, z: Math.random() * 0.8 + 0.2 }));
  cols = Array.from({ length: Math.ceil(W / 16) }, () => ((Math.random() * H) / 16) | 0);
  hearts = Array.from({ length: Math.round(W / 26) }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 12 + Math.random() * 22,
    v: 0.5 + Math.random() * 1.2, p: Math.random() * 6, a: 0.35 + Math.random() * 0.55, w: Math.random() < 0.3 }));
}
function frame(t) {
  requestAnimationFrame(frame);
  if (cv.hidden) return;
  if (st.mode === 'hearts') {
    const ac = css('--accent'), fg = css('--fg');
    cx.clearRect(0, 0, W, H); cx.textAlign = 'center';
    for (const h of hearts) {
      if (!reduce) { h.y += h.v; h.p += 0.02; h.x += Math.sin(h.p) * 0.4; if (h.y > H + 30) { h.y = -30; h.x = Math.random() * W; } }
      cx.globalAlpha = h.a; cx.fillStyle = h.w ? fg : ac; cx.font = h.s + 'px system-ui'; cx.fillText('♥', h.x, h.y);
    }
    cx.globalAlpha = 1; return;
  }
  if (st.mode === 'stars') {
    cx.clearRect(0, 0, W, H); cx.fillStyle = css('--fg');
    for (const s of stars) {
      if (!reduce) s.x = (s.x + s.z * 0.15) % W;
      cx.globalAlpha = 0.2 + s.z * 0.5; cx.fillRect(s.x, s.y, s.z * 1.8, s.z * 1.8);
    }
    cx.globalAlpha = 1;
  } else if (t - last > 50) {
    last = t; cx.textAlign = 'start';
    cx.globalCompositeOperation = 'destination-out'; cx.fillStyle = 'rgba(0,0,0,.1)'; cx.fillRect(0, 0, W, H);
    cx.globalCompositeOperation = 'source-over'; cx.fillStyle = css('--accent'); cx.font = '14px monospace';
    cols.forEach((y, i) => {
      cx.fillText(GL[(Math.random() * GL.length) | 0], i * 16, y * 16);
      cols[i] = y * 16 > H && Math.random() > 0.97 ? 0 : y + 1;
    });
  }
}
function apply() {
  cv.hidden = (st.image && st.mode !== 'hearts') || st.mode === 'off';
  if (!cv.hidden) { init(); cx.clearRect(0, 0, W, H); }
}
export function setLive(o) {
  st = { ...st, ...o };
  if (o.mode) try { localStorage.setItem('wp', o.mode); } catch {}
  apply();
}
addEventListener('resize', () => { if (!cv.hidden) init(); });
apply(); requestAnimationFrame(frame);
