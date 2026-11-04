// Live wallpaper on a canvas: drifting stars or code rain. Hidden when an uploaded wallpaper is set.
const cv = document.getElementById('live'), cx = cv.getContext('2d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let saved = null; try { saved = localStorage.getItem('wp'); } catch {}
let st = { mode: saved || 'stars', image: false };
if (reduce && st.mode === 'rain') st.mode = 'stars';
let W = 0, H = 0, stars = [], cols = [], last = 0;
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const GL = 'アイウエオカキクケコサシスセソ0123456789';

function init() {
  W = cv.width = cv.clientWidth; H = cv.height = cv.clientHeight;
  stars = Array.from({ length: Math.round((W * H) / 9000) }, () => ({ x: Math.random() * W, y: Math.random() * H, z: Math.random() * 0.8 + 0.2 }));
  cols = Array.from({ length: Math.ceil(W / 16) }, () => ((Math.random() * H) / 16) | 0);
}
function frame(t) {
  requestAnimationFrame(frame);
  if (cv.hidden) return;
  if (st.mode === 'stars') {
    cx.clearRect(0, 0, W, H); cx.fillStyle = css('--fg');
    for (const s of stars) {
      if (!reduce) s.x = (s.x + s.z * 0.15) % W;
      cx.globalAlpha = 0.2 + s.z * 0.5; cx.fillRect(s.x, s.y, s.z * 1.8, s.z * 1.8);
    }
    cx.globalAlpha = 1;
  } else if (t - last > 50) {
    last = t;
    cx.globalCompositeOperation = 'destination-out'; cx.fillStyle = 'rgba(0,0,0,.1)'; cx.fillRect(0, 0, W, H);
    cx.globalCompositeOperation = 'source-over'; cx.fillStyle = css('--accent'); cx.font = '14px monospace';
    cols.forEach((y, i) => {
      cx.fillText(GL[(Math.random() * GL.length) | 0], i * 16, y * 16);
      cols[i] = y * 16 > H && Math.random() > 0.97 ? 0 : y + 1;
    });
  }
}
function apply() {
  cv.hidden = st.image || st.mode === 'off';
  if (!cv.hidden) { init(); cx.clearRect(0, 0, W, H); }
}
export function setLive(o) {
  st = { ...st, ...o };
  if (o.mode) try { localStorage.setItem('wp', o.mode); } catch {}
  apply();
}
addEventListener('resize', () => { if (!cv.hidden) init(); });
apply(); requestAnimationFrame(frame);
