# portfolio-static

    site/     the website (plain files: publish this folder)
    editor/   local-only editor (never publish this)

## Edit your content
Windows: double-click `Editor.bat`.  Any OS: `npm install` once, then `npm run editor`.
The editor opens at http://localhost:4000. Change projects, resume, taskbar links, colors, wallpaper, then press
**Save all**. Preview your real site at http://localhost:8080 (refresh after saving).
Everything is written to `site/data/*.json` and `site/img/`.

## Publish
Upload/serve the `site/` folder: Cloudflare Pages or Netlify (publish directory: `site`), or copy it to the Pi
and serve it with nginx/Caddy (`root /home/pi/portfolio-static/site;`). GitHub Pages only serves `/` or `/docs`,
so use an Action or rename the folder.
Workflow with git: Save in the editor, then `git add . && git commit -m "update" && git push`.

Notes: paths are relative, so the site also works under a subpath. Back up by copying the whole folder (or use git).
