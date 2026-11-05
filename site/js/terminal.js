import { api, themes, setTheme, curTheme } from './apps.js';
import { setLive } from './live.js';

const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const PUB = ['help', 'ls', 'cd', 'cat', 'open', 'pwd', 'whoami', 'date', 'echo', 'history', 'clear', 'neofetch', 'uname', 'theme', 'wallpaper', 'matrix', 'cowsay', 'fortune', 'sl', 'snake', 'breakout', 'hire-me'];
const APPS = ['cv', 'projects', 'cmd', 'games', 'homework', 'bin', 'snake', 'breakout'];
const JOKES = {
  vim: 'You opened vim. There is no escape. (Just kidding: Esc, then :q!)',
  ':q': 'This is not vim. ...or is it?',
  emacs: 'Emacs is a great operating system. It just lacks a good text editor.',
  nano: 'A sensible choice.',
  exit: 'There is no escape. Try closing the window like a normal person.',
  git: 'fatal: not a git repository (or any of the parent directories): reality',
  make: 'make: *** No rule to make target "sandwich". Stop.',
};
const FORTUNES = ['There is no place like 127.0.0.1.', 'It works on my machine.', 'A watched build never finishes.',
  'Have you tried turning it off and on again?', 'sudo make me a sandwich.', 'Premature optimization is the root of all fun.'];
const cow = (t) => String.raw` ${'_'.repeat(t.length + 2)}
< ${t} >
 ${'-'.repeat(t.length + 2)}
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||`;
const TRAIN = String.raw`      ====        ________
  _D _|  |_______/        \__I_I_____===__|_________
   |(_)---  |   H\________/ |   |        =|___ ___|
   /     |  |   H  |  |     |   |         ||_| |_||
  |      |  |   H  |__--------------------| [___] |
  | ________|___H__/__|_____/[][]~\_______|       |
  |/ |   |-----------I_____I [][] []  D   |=======|__`;

export function Term(body, A) {
  body.classList.add('term');
  const out = document.createElement('div'), row = document.createElement('div');
  const ps = document.createElement('span'), inp = document.createElement('input');
  inp.autocomplete = 'off'; inp.spellcheck = false; inp.setAttribute('aria-label', 'terminal input');
  row.className = 'row'; row.append(ps, inp);
  body.replaceChildren(out, row);

  let user = 'guest', cwd = '~', mode = 'cmd', hist = [], hi = 0, plist = [];
  const load = () => api('/projects').then((l) => (plist = l)).catch(() => {});
  const sync = () => (body.isConnected ? load() : document.removeEventListener('projects-changed', sync));
  document.addEventListener('projects-changed', sync); load();
  const names = () => plist.map((p) => slug(p.title));
  const inProj = () => cwd === '~/projects';
  const prompt = () => { ps.textContent = mode === 'pass' ? '[sudo] password for admin: ' : `${user}@portfolio:${cwd}$ `; };
  const print = (t = '', c = '') => {
    const d = document.createElement('div'); d.className = c; d.textContent = t; out.append(d);
    body.scrollTop = body.scrollHeight;
  };
  let tries = 0;
  const startLogin = () => { tries = 0; mode = 'pass'; inp.type = 'password'; prompt(); };
  const printResume = async () => {
    const r = await api('/resume');
    print(`${r.name} - ${r.title}\n${r.summary}\n${[r.email, r.location].filter(Boolean).join(' | ')}`);
    (r.sections || []).forEach((s) => {
      print('\n## ' + s.heading);
      (s.items || []).forEach((i) => print(`- ${i.title}${i.sub ? ' @ ' + i.sub : ''}${i.date ? ' (' + i.date + ')' : ''}`));
    });
  };
  const showProject = (p) => print(`${p.title}\n${p.tags.map((t) => '#' + t).join(' ')}\n\n${p.description}\n` +
    [p.live_url && 'Live: ' + p.live_url, p.repo_url && 'Source: ' + p.repo_url].filter(Boolean).join('\n'));

  const cmds = {
    help: () => print('Commands:\n  ls, cd, cat, pwd      browse (try: cd projects, ls, cat <project>)\n  open <name>           cv, projects, cmd, or a project\n  theme [name]          ' + themes.join(' | ') + '\n  wallpaper stars|rain|off\n  hire-me               contact details\n  neofetch, uname, date, whoami, echo, history, clear\n  cowsay, fortune, matrix, sl\n  snake, breakout        games (also in the Games folder)\nTab completes. Ctrl+K opens the launcher.'),
    clear: () => out.replaceChildren(),
    whoami: () => print(user),
    pwd: () => print('/home/' + user + (inProj() ? '/projects' : '')),
    date: () => print(new Date().toString()),
    echo: (a) => print(a.join(' ')),
    uname: () => print('Linux portfolio 6.8.0-webterm ' + (navigator.platform || 'x86_64') + ' GNU/Linux'),
    history: () => print(hist.map((h, i) => ` ${i + 1}  ${h}`).join('\n')),
    ls: ([d]) => {
      const proj = d ? /^(~\/|\/home\/\w+\/)?projects\/?$/.test(d) : inProj();
      print(proj ? names().join('  ') || '(empty)' : 'projects/  resume.txt');
    },
    cd: ([d = '~']) => {
      if (d === '..' || d === '~' || d === '/home/' + user) cwd = '~';
      else if (/^(~\/)?projects\/?$/.test(d)) cwd = '~/projects';
      else print(`cd: ${d}: No such file or directory`, 'err');
      prompt();
    },
    cat: ([f = '']) => {
      if (f === 'resume' || f === 'resume.txt') return printResume();
      const name = f.replace(/^(~\/)?projects\//, '');
      const p = (inProj() || name !== f) && plist.find((x) => slug(x.title) === name);
      p ? showProject(p) : print(`cat: ${f}: No such file or directory`, 'err');
    },
    open: ([w = '']) => {
      const p = plist.find((x) => slug(x.title) === w);
      if (APPS.includes(w)) A[w]();
      else if (p) A.project(p);
      else return print(`open: ${w}: not found (try: cv, projects, cmd, or a project name)`, 'err');
      print('opening ' + w + '...');
    },
    theme: ([n]) => (n
      ? (setTheme(n) ? print('theme: ' + n) : print(`theme: unknown "${n}". Available: ${themes.join(', ')}`, 'err'))
      : print(`current: ${curTheme()}\navailable: ${themes.join(', ')}`)),
    wallpaper: ([m]) => (['stars', 'rain', 'off'].includes(m) ? (setLive({ mode: m }), print('wallpaper: ' + m)) : print('usage: wallpaper stars|rain|off', 'err')),
    matrix: () => { setLive({ mode: 'rain' }); print('Wake up, guest...\n(run "wallpaper stars" to go back)'); },
    cowsay: (a) => print(cow(a.join(' ') || 'moo')),
    fortune: () => print(FORTUNES[(Math.random() * FORTUNES.length) | 0]),
    sl: () => print(TRAIN),
    snake: () => { A.snake(); print('launching snake...'); },
    breakout: () => { A.breakout(); print('launching breakout...'); },
    'hire-me': async () => {
      const r = await api('/resume');
      print(r.email ? `Say hi: ${r.email}` : 'No email on file yet.'); A.cv();
    },
    neofetch: () => {
      const logo = ['   ___  ', '  /   \\ ', ' | >_  |', '  \\___/ ', '        '];
      const info = [`${user}@portfolio`, '-----------------', 'OS: Portfolio OS 1.0', `Theme: ${curTheme()}`,
        `Resolution: ${innerWidth}x${innerHeight}`, `Uptime: ${Math.round(performance.now() / 60000)} min`];
      print(info.map((l, i) => (logo[i] ?? '').padEnd(10) + l).join('\n'));
    },
    // easter egg: not listed in help or tab completion
    sudo: (a) => (a[0] === 'admin' ? startLogin()
      : /^rm/.test(a.join(' ')) ? print('Nice try. This incident will be reported.', 'err')
      : print(`${user} is not in the sudoers file. This incident will be reported.`, 'err')),
  };

  Object.entries(JOKES).forEach(([k, v]) => { cmds[k] = () => print(v); });

  const tab = () => {
    const v = inp.value, parts = v.split(/\s+/), last = parts.pop();
    let pool;
    if (!parts.length) pool = PUB;
    else {
      const c = parts[0];
      pool = c === 'cat' ? ['resume.txt', ...(inProj() ? names() : ['projects/'])]
        : c === 'cd' ? ['projects', '..', '~']
        : c === 'open' ? [...APPS, ...names()]
        : c === 'theme' ? themes : c === 'wallpaper' ? ['stars', 'rain', 'off'] : c === 'ls' ? ['projects'] : [];
    }
    const m = pool.filter((x) => x.startsWith(last));
    if (!m.length) return;
    let pre = m[0];
    for (const x of m) while (!x.startsWith(pre)) pre = pre.slice(0, -1);
    if (m.length > 1) { print(ps.textContent + v); print(m.join('  ')); }
    inp.value = [...parts, pre].join(' ') + (m.length === 1 && !parts.length ? ' ' : '');
  };

  inp.onkeydown = async (e) => {
    if (e.key === 'Tab') { e.preventDefault(); if (mode === 'cmd') tab(); return; }
    if (e.key === 'ArrowUp' && mode === 'cmd') { hi = Math.max(0, hi - 1); inp.value = hist[hi] || ''; e.preventDefault(); return; }
    if (e.key === 'ArrowDown' && mode === 'cmd') { hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ''; return; }
    if (e.key !== 'Enter') return;
    const v = inp.value; inp.value = '';

    if (mode === 'pass') {
      print(ps.textContent);
      if (++tries < 3) return print('Sorry, try again.', 'err');
      mode = 'cmd'; inp.type = 'text'; print('sudo: 3 incorrect password attempts', 'err');
      return prompt();
    }
    print(ps.textContent + v);
    if (!v.trim()) return;
    hist.push(v); hi = hist.length;
    const [c, ...args] = v.trim().split(/\s+/);
    try { Object.hasOwn(cmds, c) ? await cmds[c](args) : print(`${c}: command not found`, 'err'); }
    catch (x) { print(String(x.message), 'err'); }
  };

  body.addEventListener('click', () => { if (!getSelection().toString()) inp.focus(); });
  print('Portfolio OS 1.0. Type "help" for commands.');
  prompt(); setTimeout(() => inp.focus(), 50);
}
