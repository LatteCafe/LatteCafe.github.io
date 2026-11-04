// Boot log -> login screen, once per browser session. Click anywhere to skip the log.
const LINES = ['Reached target Basic System', 'Mounted /home/guest', 'Started SQLite database', 'Started HTTP server',
  'Loaded desktop environment', 'Reached target Graphical Interface'];
export function boot() {
  const o = document.getElementById('boot');
  let seen = null; try { seen = sessionStorage.getItem('booted'); } catch {}
  if (seen) return o.remove();
  const log = document.getElementById('bootlog'), form = document.getElementById('login');
  let i = 0, t;
  const login = () => { clearInterval(t); form.hidden = false; form.querySelector('button').focus(); };
  form.onsubmit = (e) => {
    e.preventDefault();
    try { sessionStorage.setItem('booted', '1'); } catch {}
    o.classList.add('out'); setTimeout(() => o.remove(), 700);
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return login();
  o.addEventListener('pointerdown', login, { once: true });
  t = setInterval(() => {
    if (i >= LINES.length) return login();
    const d = document.createElement('div'), ok = document.createElement('span');
    ok.className = 'ok'; ok.textContent = '[  OK  ] '; d.append(ok, LINES[i++]); log.append(d);
  }, 120);
}
