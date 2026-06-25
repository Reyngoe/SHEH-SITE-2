# SHEH — Site 2 (shehthrive.org)

The content & entertainment home of The S.H.E.H Company. Companion to the storefront
at **shehthrive.com** (Site 1). Site 1 sells; Site 2 carries the brand — the writing,
the photography, the film, and the creed behind the name.

## Structure
```
index.html          the homepage (generated — do not hand-edit)
our-story.html      Our Story (full room)
the-creed.html      The Creed (full room)
src/
  build.py          regenerates index.html from the sections
  sections/         the 10 homepage sections (edit these)
```

## Editing
1. Edit a file in `src/sections/` (or a room page directly).
2. Run: `python3 src/build.py`
3. `index.html` is rewritten. Commit and push.

Each section is a standalone HTML file. The build inlines all ten into one page and
scopes each one's CSS under its own `#id`, so sections never collide.

## Scroll order
Hero → Manuscripts → Illuminations → The Long Take → Our Story → The Creed
→ News → Social → Join → Footer

## Deploy (static — no server)
**GitHub Pages:** push to a repo → Settings → Pages → deploy from `main` / root.
**Cloudflare Pages:** connect the repo, framework = None, build command = none,
output dir = `/`. Then point shehthrive.org at it.

See STATUS.md (what's live) and PENDING.md (what still needs wiring).
