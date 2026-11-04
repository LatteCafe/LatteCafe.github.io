// Window manager: open/focus/minimize/maximize/close, drag, resize, taskbar buttons.
export const WM = (() => {
  let z = 10, n = 0;
  const wins = new Map();
  const desk = document.getElementById('desktop'), tasks = document.getElementById('tasks');

  const focus = (w) => {
    w.el.style.zIndex = ++z;
    wins.forEach((x) => { x.el.classList.toggle('act', x === w); x.tb.classList.toggle('act', x === w && !x.el.classList.contains('min')); });
  };
  const minimize = (w) => { w.el.classList.add('min'); w.tb.classList.remove('act'); };
  const restore = (w) => w.el.classList.remove('min');
  const close = (w) => { w.el.remove(); w.tb.remove(); wins.delete(w.id); };

  function track(handle, start, move, end) {
    handle.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      const s = start(e); if (!s) return;
      handle.setPointerCapture(e.pointerId);
      const m = (ev) => move(ev, s);
      handle.addEventListener('pointermove', m);
      handle.addEventListener('pointerup', (ev) => { handle.removeEventListener('pointermove', m); if (end) end(ev, s); }, { once: true });
      e.preventDefault();
    });
  }
  // Drag to the left/right edge to half-snap, to the top edge to maximize.
  const SNAP = { l: 'left:0;top:0;width:50%;height:100%', r: 'left:50%;top:0;width:50%;height:100%' };
  const zone = (e) => (e.clientX < 6 ? 'l' : e.clientX > innerWidth - 6 ? 'r' : e.clientY < 6 ? 't' : null);
  let ghost;
  const showGhost = (z) => {
    ghost ||= Object.assign(document.createElement('div'), { className: 'snap' });
    if (!ghost.isConnected) desk.append(ghost);
    ghost.style.cssText = z ? (z === 't' ? 'inset:0' : SNAP[z]) : 'display:none';
  };
  const drag = (el, h, snap = true) => track(h,
    (e) => { if (el.classList.contains('max')) return null; const r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; },
    (e, s) => {
      el.style.right = 'auto';
      el.style.left = Math.max(80 - el.offsetWidth, Math.min(innerWidth - 80, e.clientX - s.x)) + 'px';
      el.style.top = Math.max(0, Math.min(innerHeight - 80, e.clientY - s.y)) + 'px';
      if (snap) showGhost(zone(e));
    },
    (e) => {
      if (!snap) return;
      const z = zone(e); showGhost(null);
      if (z === 't') el.classList.add('max');
      else if (z) { el.classList.remove('max'); el.style.cssText += ';' + SNAP[z]; }
    });
  const resize = (el, h) => track(h,
    (e) => ({ w: el.offsetWidth, h: el.offsetHeight, x: e.clientX, y: e.clientY }),
    (e, s) => {
      el.style.width = Math.max(300, s.w + e.clientX - s.x) + 'px';
      el.style.height = Math.max(200, s.h + e.clientY - s.y) + 'px';
    });

  function open(id, o) {
    let w = wins.get(id);
    if (w) { restore(w); focus(w); return w; }

    const el = document.createElement('section');
    el.className = 'win'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', o.title);
    el.style.cssText = `width:${o.w || 640}px;height:${o.h || 420}px;left:${40 + n * 28}px;top:${30 + n * 28}px`;
    n = (n + 1) % 8;
    el.innerHTML = '<header class="bar"><span class="ttl"></span><span class="ctl">' +
      '<button data-a="min" title="Minimize" aria-label="Minimize">–</button>' +
      '<button data-a="max" title="Maximize" aria-label="Maximize">▢</button>' +
      '<button data-a="close" title="Close" aria-label="Close">×</button></span></header>' +
      '<div class="body"></div><i class="rz"></i>';
    el.querySelector('.ttl').textContent = o.title;
    const body = el.querySelector('.body');
    if (o.flush) body.classList.add('flush');

    const tb = document.createElement('button');
    tb.textContent = o.title;
    w = { id, el, tb, body };
    wins.set(id, w); desk.append(el); tasks.append(tb);

    tb.onclick = () => {
      if (el.classList.contains('min')) { restore(w); focus(w); }
      else if (tb.classList.contains('act')) minimize(w);
      else focus(w);
    };
    el.addEventListener('pointerdown', () => focus(w));
    el.querySelector('.ctl').onclick = (e) => {
      const a = e.target.dataset.a;
      if (a === 'min') minimize(w);
      if (a === 'max') el.classList.toggle('max');
      if (a === 'close') close(w);
    };
    const bar = el.querySelector('.bar');
    bar.ondblclick = (e) => { if (!e.target.closest('button')) el.classList.toggle('max'); };
    drag(el, bar); resize(el, el.querySelector('.rz'));

    Promise.resolve(o.render(body)).catch((e) => { body.textContent = 'Error: ' + e.message; });
    focus(w);
    return w;
  }
  return { open, close, drag };
})();
