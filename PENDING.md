# PENDING — Site 2

## SHEH News integration — DONE
- [x] Brought the private `worker.js` into the chat.
- [x] Built the public read-only fork → `news/sheh-news-public-worker.js`.
- [x] Deployed the fork → https://sheh-news-public.jcrack053.workers.dev
- [x] Wired the homepage preview to the fork, brand-curated by content (editable themes +
      scoring in `src/sections/news.html`), scanning the whole brief, on-brand items only.
- [x] "Read today's full briefing →" → the fork's read-only reader.
  Note: the curated preview only renders live once the SITE is deployed — the artifact viewer
  blocks the cross-origin fetch, so there you'll see the three fallback cards. Verify live.

## Email signup
- [ ] Parked. When ready, wire the field to a free list (MailerLite ≤ 1k, Kit ≤ 10k) or a
      tiny email-capture Worker (free — no AI call). Keep the box design; point it at the
      provider's form action.

## Pages not built yet — windows DISABLED for launch (decision resolved: clean-launch)
The dead `href="#"` clicks are gone: cards are static "in-progress" tiles and each "the full
___, this way →" link is now an honest non-clickable status line. Build these interior pages
as a fast-follow, then re-link (swap each section's status line back to a real link, or relink
the cards):
- [ ] Manuscripts interior page (philosophy / field notes / from the road).
- [ ] Illuminations interior gallery.
- [ ] The Long Take interior reel (also: swap the film teaser's decorative play button for a
      real video embed when there's footage).

## Deploy (when ready)
- [ ] Push repo to GitHub → enable Pages (or connect Cloudflare Pages) → point shehthrive.org.
      Steps in README.

## Optional / nice-to-have
- [ ] Footer "Our Story" / "The Creed" jump to the door panels; could point to the rooms.
- [ ] Real product/lifestyle photography to replace placeholders.
- [ ] Old Man Roy AI chatbot (separate project; shares the Worker + API engine).
