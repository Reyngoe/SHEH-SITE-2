# CLAUDE.md — SHEH Site 2 working context

## What this is
Site 2 = **shehthrive.org**, the content/entertainment hub for The S.H.E.H Company.
Site 1 = **shehthrive.com**, the storefront (separate repo, tended in its own chat — do
not touch from here). Site 1 SELLS the product; Site 2 carries the brand foundation
(writing, photo, film, the creed). The brand energy — health, the standard, best-version-
of-yourself, the way of building — carries over freely; the *selling* (buy it, flavors,
first batch) stays on Site 1.

## Voice
Calm, stoic mentor. "Tailgate voice" — plain-spoken, second person, no hype, no
LinkedIn-speak. Pillars (locked): Built not given / Start hard / End hard / Hard not harsh
/ The Long Game. Motto: **Start Hard. End Hard.** Names: SHEH / S.H.E.H / The S.H.E.H Company.

## Design language
Fonts: **Cinzel** (display, all-caps) + **EB Garamond** (body). Two worlds, "the library
by day and by lamplight": warm parchment soul-rooms (paper #E6D1A4, ink #241A0E) and a
warm-dark lamplit wing (ground #0f0a06, amber #C9772E). Ornament = rotated ◆ between thin
rules. Per-room accents: Manuscripts amber, Illuminations blue, The Long Take green, Our
Story bronze (#6E4A12), The Creed oxblood (#6E2A20). prefers-reduced-motion respected.

## Architecture
Ten sections in `src/sections/` are inlined into `index.html` by `src/build.py`, each
scoped under its `#id` (`#hero`, `#news`, ...). The Hero's keyframes are lifted global; its
time-of-day script reads the visitor's clock. Two full room pages at root: `our-story.html`,
`the-creed.html`. Doors (story/creed sections) link into them. Scroll order: Hero →
Manuscripts → Illuminations → The Long Take → Our Story → The Creed → News → Social → Join
→ Footer.

## SHEH News integration
SHEH News is the founder's hand-built Cloudflare Worker (Anthropic API + KV + 6:45 AM cron,
multi-source verified, organized into desks). It is sensitive, personal work.
- Private app: **https://sheh-news.jcrack053.workers.dev** (PIN-gated). **NEVER modify it.**
- Site 2 surfaces a **separate PUBLIC, read-only fork** (PIN + refresh-cap stripped, cached
  brief only — one morning pull feeds all visitors, no paid per-visitor pulls).
- The homepage News **PREVIEW** is brand-curated to the health/wellness lane, and the
  curation is **CONTENT/THEME-based, not tied to desk names** — the feed is dynamic over
  time, so the preview must read each item's actual topic. Full feed behind the door keeps
  everything.
- Fork from the real `worker.js`, never from memory. See PENDING.md for build steps.

## To change anything
Edit `src/sections/<name>.html` (or a room page, or these docs) → `python3 src/build.py` →
re-zip. Never hand-edit `index.html`; it's generated.

## Keeping docs alive
STATUS.md and PENDING.md are living. Update them the moment a decision locks — same
discipline Site 1 runs. Don't let them drift behind the real state.
