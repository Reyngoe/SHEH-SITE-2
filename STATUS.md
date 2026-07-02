# STATUS — Site 2

_Living doc. Updated the moment a decision locks — not just at packaging._

> **STATUS (synced July 2026): Site 2 is DEPLOYED & LIVE at https://shehthrive.org.**
> Auto-deploys on every push to `main`. Email capture is live on both sites (this one →
> SHEH Content; Site 1 → SHEH Marketplace). What's left is content + the welcome email —
> see PENDING.md.

## Done
- Homepage assembled (`index.html`), all 10 sections in final scroll order.
- Single inlined document; each section's CSS scoped under its `#id` (no collisions).
- Overlay menu (◆ button) + smooth scroll.
- Doors → rooms: Our Story → `our-story.html`, The Creed → `the-creed.html`.
- Rooms have a "← Home" link back to `index.html`.
- Footer section-nav wired to on-page anchors.
- Socials wired everywhere to **@the1sheh** (Instagram, X, YouTube) + email.
- Footer "merch" line → shehthrive.com.
- Email signup **WIRED & LIVE**: "Become a SHEH" box posts to MailerLite → **SHEH Content**
  group. Design untouched; hidden-iframe submit keeps visitors on-page; custom success line;
  honeypot for bots. Live-tested working. (Full details below.)
- **Unbuilt windows cleanly disabled for launch** — Manuscripts / Illuminations / The Long
  Take. The placeholder cards are no longer links (no `href="#"`, hover-lift removed → static
  "in-progress" tiles), and each section's "the full ___, this way →" link is now an honest,
  non-clickable status line in the same spot ("The rest is still being written / developing /
  rolling"). Real weight-plate photo + film teaser kept. Nothing on the homepage dead-ends.
  Interior pages remain a fast-follow (see PENDING).

## SHEH News — wired (see PENDING.md for the remaining site deploy)
- **Public read-only fork DEPLOYED:** https://sheh-news-public.jcrack053.workers.dev
  (source kept at `news/sheh-news-public-worker.js`). Binds the SAME KV namespace as the
  private app; no `/refresh`, no cron, no API key, no PIN — cannot pull or spend.
- **Homepage News preview is LIVE-WIRED:** fetches the fork's cached brief, scans every wire,
  and surfaces the on-brand (health/wellness) ones by content — editable theme list + scoring
  live in `src/sections/news.html` (the EDIT BLOCK). Three static cards remain as a fallback.
  "Read today's full briefing →" opens the fork's read-only reader.
- **Private app:** https://sheh-news.jcrack053.workers.dev (PIN-gated). **Never modified.**
- **Site 2 gets a separate PUBLIC, read-only fork:** the worker copied, PIN + refresh-cap
  stripped, serving only the cached brief. One morning pull feeds every visitor → cheap,
  and no one can trigger a paid pull on the founder's dime.
- **Homepage News PREVIEW is brand-curated** to the health/wellness lane (fitness,
  exercise, longevity, nutrition, health science, recovery, sleep). The full feed behind
  the door keeps everything (all desks).
- **Curation is CONTENT/THEME-based, NOT tied to a desk name.** The feed is dynamic —
  desks get renamed / added / removed over time — so the preview reads each item's actual
  topic and stays on-brand as the feed evolves. Likely cleanest: topic-tag during the
  morning pull (AI already running = free), and the site filters the cached brief by brand
  themes.

## Working model
The repo is the canonical tree. Edit a section in `src/sections/` (or a room page, or these
docs) → run `python3 src/build.py` → `index.html` regenerates → re-zip. Never hand-edit
`index.html`.

## Live links
- IG  https://www.instagram.com/the1sheh
- X   https://x.com/the1sheh
- YT  https://www.youtube.com/@the1sheh
- Email  the1sheh@gmail.com
- Storefront  https://shehthrive.com
- SHEH News (private)  https://sheh-news.jcrack053.workers.dev

## Latest package — current (deploy-ready)
- Homepage image pulled out of inline base64 into `assets/illuminations-plate.jpg` (byte-identical, CDN-cacheable). Homepage **210 KB -> 61 KB**. Path is repo-relative, so it resolves on both the `*.pages.dev` preview and the live domain.
- Verified: `python3 src/build.py` runs clean, `index.html` regenerated and in sync, all 9 anchors resolve, no base64 left.
- Repo: **github.com/Reyngoe/SHEH-SITE-2** (public).
- Deploy: GitHub repo -> **Cloudflare Pages** (Git-connected; **build command BLANK**, output `/`) -> **shehthrive.org** (already Active on Cloudflare; custom-domain step is one click). Every push to `main` auto-deploys.

## Email capture — wired (MailerLite)
- "Become a SHEH" box (`src/sections/join.html`) now posts to MailerLite embedded form (account 2478250, form 191753874771543964), subscribers land in the **SHEH Content** group.
- Design untouched. Submits via hidden iframe so the visitor stays on the page; custom success line swaps in ("You're in..."). Honeypot field (`url`) added to catch bots.
- Field: `fields[email]` + hidden `ml-submit=1`, `anticsrf=true`.
- **Tested live and working** on shehthrive.org.
- **Site 1 (.com) DONE too:** mirrored with a second MailerLite form → **SHEH Marketplace**
  group (separate `SHEH-Website` repo). One account, two forms, two groups, deduped overlap.
- Still open (short-term): MailerLite **welcome email** (new signups currently hear nothing
  after joining); confirm the **double opt-in** setting matches the "You're in" wording
  (reword to prompt confirmation if it's ON). See PENDING.md.

## Content Library — Phase 1 (Worker code ready; DEPLOY PENDING)
- New: `library/sheh-library-worker.js` — the "librarian." Public reads (`/manifest`,
  `/essay/<id>`, `/asset/<key>`), PIN-gated writes (`/add`, `/remove`, `/update`, `/reorder`),
  two PINs (Reyngoe + Patrick, items record who added what), rate-limited attempts.
- Storage: **KV-only to start (no card, ~1 GB ≈ thousands of resized photos).** R2 optional
  later — add a `LIBRARY_R2` binding and it upgrades automatically; old KV files keep serving.
- Deploy (dashboard): new KV namespace → new Worker `sheh-library` → paste file → binding
  `LIBRARY_KV` → secrets `PIN_REYNGOE` + `PIN_PATRICK` → redeploy → GET / shows `{"ok":true}`.
- Phase 2 = data-driven rooms + homepage wiring (supersedes the three PENDING room items).
  Phase 3 = the `#studio` edit mode. Videos = YouTube IDs; Manuscripts = text + PDFs + links.

## Content Library — Phase 2 (rooms LIVE-WIRED; push pending)
- Worker DEPLOYED: https://sheh-library.jcrack053.workers.dev (storage: KV, verified `{"ok":true}`).
- Three data-driven rooms at root: `manuscripts.html` (essays open in a reading view;
  PDFs/links open out), `illuminations.html` (framed-plate gallery), `the-long-take.html`
  (YouTube reels via youtube-nocookie). Each matches the house style (parchment, Cinzel,
  per-room accent, ◆ ornament) and has an honest empty state in the locked voice
  ("The first pages are still being written." / "The gallery is still developing." /
  "The first reel is still rolling."). All content rendering is escaped + validated.
- Homepage sections wired (one shared manifest fetch): when a section has items, its tiles
  populate with the latest few and the status line becomes a real "…, this way →" link to
  the room. **When the library is empty or unreachable, the homepage stays EXACTLY as
  before** — the fallback guarantee holds.
- Next: **Phase 3 — the #studio edit mode** (PIN-gated add/remove/caption/reorder from the
  phone). First real test = adding a photo to Illuminations.

## Content Library — Phase 3 (THE STUDIO — shipped; live test pending)
- New: `studio.js` (root). Loads only when a page is opened with `#studio` or a PIN is
  already remembered on the device. PIN checked server-side (no-op /reorder ping);
  remembered in localStorage; "Lock" forgets it. 401 auto-locks; 429 messaged.
- The bar: floating ◆ STUDIO with "+ Add" (any page) and "Lock". Add sheet covers all
  kinds — photo (auto-shrunk in-browser to ≤1600px JPEG before upload), essay (title +
  body), PDF, outside link, YouTube video — with section/kind pickers and dates.
- In the rooms: every item gets ↑ ↓ / ✎ Edit / ✕ Remove controls (items carry data-id
  stamps; a MutationObserver decorates them after the async render). Reorder posts the
  new order debounced; essay editing loads the body for in-place rewriting.
- Loader rides into the homepage via the footer section; each room carries its own.
- First live test: open shehthrive.org/#studio → PIN → + Add → photo to Illuminations.

## Illuminations — baked-in photo retired
- The static weight-plate photo was removed from the homepage fallback (and `assets/` deleted);
  the library is now the ONLY photo source. The `.plate.filled` styles remain — Studio-added
  photos use them. Fallback now shows the three "Shutter's coming into focus." plates.
- The photo itself was handed back to Reyngoe to re-add via the Studio (caption: "Built not given.").

## Chrome congruence + frame floors (push pending)
- All five interior pages (3 rooms + Our Story + The Creed) now carry the homepage hamburger
  menu and full site footer, links adapted; lone "back home" bylines removed (Our Story kept its
  own original link — it used different markup). Studio loader added to Our Story/The Creed too.
- Homepage sections keep a full grid as content arrives: library items fill from the front and
  the section's own "developing" plates pad to the floor (Illum 4 / Long Take 4 / Manuscripts 3).
- Rule locked into CLAUDE.md for all future pages.

## Buckets + video clips (push + WORKER REPASTE pending)
- Manuscripts now has four shelves (locked names): PHILOSOPHY / THE LIGHTER SIDE /
  LETTERS FROM THE FOUNDERS / TALES FROM THE ROAD. Slugs: philosophy, lighter-side,
  letters, tales. Studio add+edit pick the shelf; homepage shows all four tiles always
  (counts fill in); manuscripts.html is the hall — one file, bucket views via #slug
  (e.g. manuscripts.html#philosophy). Unfiled/legacy items surface in the hall for re-filing.
- Long Take accepts direct video uploads (kind "clip"): MP4/MOV/WebM, **20 MB cap**
  (KV ceiling ≈ 20–40 s of 1080p phone video; 1–3 min pieces stay on YouTube). Studio
  refuses oversized files instantly at pick time. Librarian now streams with Range
  support (seek/scrub works); homepage shows a film-plate ▶ tile for clips.
- **REQUIRED: repaste the librarian** — library/sheh-library-worker.js changed (clip kind,
  bucket field, range streaming). Dashboard → sheh-library → Edit code → replace → Deploy.
  Bindings/secrets persist. Site push is safe before or after (old worker just ignores
  the new fields until repasted).
- Bucket registry lives in THREE files (keep in sync): src/sections/manuscripts.html,
  manuscripts.html, studio.js.
