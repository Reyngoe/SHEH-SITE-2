# SHEH — Site 2 (shehthrive.org)

The content & entertainment home of The S.H.E.H Company. Companion to the storefront
at **shehthrive.com** (Site 1). Site 1 sells; Site 2 carries the brand — the writing,
the photography, the film, and the creed behind the name.

## Structure
```
index.html          the homepage (generated — do not hand-edit)
manuscripts.html    Manuscripts (data-driven room; shelf views via #slug)
illuminations.html  Illuminations (data-driven gallery room)
the-long-take.html  The Long Take (data-driven film room)
our-story.html      Our Story (full room)
the-creed.html      The Creed (full room)
studio.js           the founders' PIN-gated edit mode (#studio)
src/
  build.py          regenerates index.html from the sections
  sections/         the 10 homepage sections (edit these)
library/            the librarian Worker source (deployed by hand — see STATUS)
news/               the public SHEH News fork source (deployed by hand)
```
(`.assetsignore` keeps src/, the docs, and the worker sources off the live site.)

## Editing
1. Edit a file in `src/sections/` (or a room page directly).
2. Run: `python3 src/build.py`
3. `index.html` is rewritten. Commit and push.

Each section is a standalone HTML file. The build inlines all ten into one page and
scopes each one's CSS under its own `#id`, so sections never collide.

## Scroll order
Hero → Manuscripts → Illuminations → The Long Take → Our Story → The Creed
→ News → Social → Join → Footer

## Deploy — LIVE
Site 2 is deployed and live at **https://shehthrive.org**.
- Repo: **github.com/Reyngoe/SHEH-SITE-2** (public).
- Host: **Cloudflare** (Git-connected; framework = None, build command = blank, output = `/`).
  Every push to `main` auto-deploys — no manual step.
- Domain: shehthrive.org, on Cloudflare (DNS + SSL). Old Squarespace records cleared.

Email capture is live: the "Become a SHEH" box → MailerLite **SHEH Content** group.

See STATUS.md (what's live) and PENDING.md (what's next).
