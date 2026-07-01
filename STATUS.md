# STATUS — Site 2

_Living doc. Updated the moment a decision locks — not just at packaging._

## Done
- Homepage assembled (`index.html`), all 10 sections in final scroll order.
- Single inlined document; each section's CSS scoped under its `#id` (no collisions).
- Overlay menu (◆ button) + smooth scroll.
- Doors → rooms: Our Story → `our-story.html`, The Creed → `the-creed.html`.
- Rooms have a "← Home" link back to `index.html`.
- Footer section-nav wired to on-page anchors.
- Socials wired everywhere to **@the1sheh** (Instagram, X, YouTube) + email.
- Footer "merch" line → shehthrive.com.
- Email signup **PARKED**: looks normal; on click shows "Sign-ups open soon" + a mailto
  to the1sheh@gmail.com. No fake confirmations. (Free wiring options noted in PENDING.)
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
- Pending: live test signup after deploy to confirm it lands in MailerLite. If double opt-in was left ON, update the success line to prompt email confirmation.
- Next (Site 1 / .com): mirror this with a second MailerLite embedded form → **SHEH Marketplace** group.
