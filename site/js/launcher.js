// Searchable launcher (Ctrl+K). getEntries() -> [{label, hint, run}]
export function Launcher(getEntries) {
  const root = document.getElementById('launcher'), q = document.getElementById('lq'), ul = document.getElementById('lres');
  let items = [], sel = 0;
  const hide = () => { root.hidden = true; };
  const run = (i) => { const e = items[i]; if (e) { hide(); e.run(); } };
  const render = () => {
    const s = q.value.toLowerCase().trim();
    items = getEntries().filter((e) => !s || e.label.toLowerCase().includes(s)).slice(0, 8);
    sel = Math.max(0, Math.min(sel, items.length - 1));
    ul.replaceChildren(...items.map((e, i) => {
      const li = document.createElement('li'), a = document.createElement('span'), b = document.createElement('small');
      a.textContent = e.label; b.textContent = e.hint || ''; li.append(a, b);
      if (i === sel) li.className = 'on';
      li.onclick = () => run(i);
      return li;
    }));
  };
  const show = () => { root.hidden = false; q.value = ''; sel = 0; render(); q.focus(); };
  q.oninput = () => { sel = 0; render(); };
  q.onkeydown = (e) => {
    if (e.key === 'ArrowDown') { sel = Math.min(items.length - 1, sel + 1); render(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); render(); e.preventDefault(); }
    else if (e.key === 'Enter') run(sel);
    else if (e.key === 'Escape') hide();
  };
  root.onclick = (e) => { if (e.target === root) hide(); };
  return { toggle: () => (root.hidden ? show() : hide()) };
}
