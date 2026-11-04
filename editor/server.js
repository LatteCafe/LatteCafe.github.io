// Local-only editor for the static site. Writes site/data/*.json and site/img/**. Never deploy this folder.
const express = require('express'), multer = require('multer'), fs = require('fs'), path = require('path'), crypto = require('crypto');
let sharp = null; try { sharp = require('sharp'); } catch { console.warn('(sharp not installed: images are saved unoptimized)'); }

const SITE = path.join(__dirname, '..', 'site'), DATA = path.join(SITE, 'data'), IMG = path.join(SITE, 'img');
const EDIT = 4000, PREVIEW = 8080;
const read = (n, d) => { try { return JSON.parse(fs.readFileSync(path.join(DATA, n + '.json'), 'utf8')); } catch { return d; } };
const write = (n, v) => { fs.mkdirSync(DATA, { recursive: true }); fs.writeFileSync(path.join(DATA, n + '.json'), JSON.stringify(v, null, 2) + '\n'); return v; };

// ---- sanitizers
const str = (v, n) => String(v ?? '').trim().slice(0, n);
const url = (v) => (/^https?:\/\//i.test(v || '') ? str(v, 500) : '');
const surl = (v) => (/^(https?:\/\/|mailto:)/i.test(v || '') ? str(v, 300) : '');
const img = (v) => (/^img\/(projects|icons|wallpapers)\/[a-f0-9]{32}\.(webp|jpg|png|gif)$/.test(v || '') ? v : '');
const icon = (v) => img(v) || (/[\/\\:.]/.test(v || '') ? '' : Array.from(str(v, 20)).slice(0, 6).join(''));
const hex = (v, d) => (/^#[0-9a-f]{6}$/i.test(v) ? v : d);
const arr = (v, n) => (Array.isArray(v) ? v.slice(0, n) : []);

const cleanProjects = (list) => {
  let next = Math.max(0, ...arr(list, 200).map((p) => +p.id || 0)) + 1;
  return arr(list, 200).map((p) => ({
    id: +p.id > 0 ? +p.id : next++, title: str(p.title, 120) || 'Untitled', label: str(p.label, 24), icon: icon(p.icon),
    description: str(p.description, 5000), tags: arr(p.tags, 12).map((t) => str(t, 30)).filter(Boolean),
    live_url: url(p.live_url), repo_url: url(p.repo_url), images: arr(p.images, 12).filter(img),
  }));
};
const cleanResume = (r = {}) => ({
  name: str(r.name, 120), title: str(r.title, 120), summary: str(r.summary, 2000), email: str(r.email, 200), location: str(r.location, 120),
  sections: arr(r.sections, 30).map((s) => ({ heading: str(s.heading, 80),
    items: arr(s.items, 50).map((i) => ({ title: str(i.title, 160), sub: str(i.sub, 160), date: str(i.date, 60), text: str(i.text, 2000) })) })),
});
const cleanSettings = (s = {}) => ({
  wallpaper: img(s.wallpaper), accent: hex(s.accent, '#e95420'), bg: hex(s.bg, '#1b1d23'),
  socials: arr(s.socials, 8).map((x) => ({ text: str(x.text, 6), title: str(x.title, 40), url: surl(x.url) })).filter((x) => x.url),
});

// ---- editor app (127.0.0.1 only; Host + custom-header checks block other websites from poking at it)
const app = express();
app.use((req, res, next) => {
  if (!new RegExp(`^(localhost|127\\.0\\.0\\.1):${EDIT}$`).test(req.headers.host || '')) return res.status(403).end();
  if (req.method !== 'GET' && req.headers['x-editor'] !== '1') return res.status(403).json({ error: 'Forbidden' });
  next();
});
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(IMG));

app.get('/api/data', (q, res) => res.json({
  projects: cleanProjects(read('projects', [])), resume: cleanResume(read('resume', {})), settings: cleanSettings(read('settings', {})),
}));
app.put('/api/projects', (req, res) => res.json({ projects: write('projects', cleanProjects(req.body.projects)) }));
app.put('/api/resume', (req, res) => res.json(write('resume', cleanResume(req.body))));
app.put('/api/settings', (req, res) => res.json(write('settings', cleanSettings(req.body))));

const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
const DIR = { project: 'projects', icon: 'icons', wallpaper: 'wallpapers' }, WIDTH = { project: 1600, icon: 256, wallpaper: 2560 };
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (q, f, cb) => (EXT[f.mimetype] ? cb(null, true) : cb(Object.assign(new Error('Images only (png, jpg, webp, gif)'), { status: 400 }))) });
app.post('/api/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const kind = DIR[req.body.kind] ? req.body.kind : 'project';
    let buf = req.file.buffer, ext = EXT[req.file.mimetype];
    if (sharp && ext !== 'gif') {
      buf = await sharp(buf).rotate().resize({ width: WIDTH[kind], withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(); ext = 'webp';
    }
    const rel = `img/${DIR[kind]}/${crypto.randomBytes(16).toString('hex')}.${ext}`;
    fs.mkdirSync(path.dirname(path.join(SITE, rel)), { recursive: true });
    fs.writeFileSync(path.join(SITE, rel), buf);
    res.json({ path: rel });
  } catch (e) { next(Object.assign(new Error('Could not process that image'), { status: 400 })); }
});

// Delete images no saved project/wallpaper refers to (skips anything newer than 10 minutes).
app.post('/api/cleanup', (q, res) => {
  const used = new Set([...read('projects', []).flatMap((p) => [...(p.images || []), p.icon]), read('settings', {}).wallpaper]);
  let removed = 0;
  for (const d of Object.values(DIR)) {
    const dir = path.join(IMG, d); if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (!used.has(`img/${d}/${f}`) && Date.now() - fs.statSync(p).mtimeMs > 600000) { fs.unlinkSync(p); removed++; }
    }
  }
  res.json({ removed });
});
app.use((e, q, res, n) => res.status(e.status || 500).json({ error: e.status ? e.message : 'Server error' }));

app.listen(EDIT, '127.0.0.1', () => {
  console.log(`\n  Editor:  http://localhost:${EDIT}\n  Preview: http://localhost:${PREVIEW}  (your site, exactly as it will be published)\n`);
  if (process.argv.includes('--open')) {
    const cmd = process.platform === 'win32' ? 'start ""' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    require('child_process').exec(`${cmd} http://localhost:${EDIT}`);
  }
});
express().use(express.static(SITE, { etag: false, maxAge: 0 })).listen(PREVIEW, '127.0.0.1');
