# PENDING — Site 2

_Synced: July 2026. **Site 2 is DEPLOYED & LIVE at https://shehthrive.org.**_
_Living doc — this list is "what's left." Keep it honest against the real state._

## DONE (was pending, now complete)
- [x] **SHEH News integration** — public read-only fork deployed
      (https://sheh-news-public.jcrack053.workers.dev), homepage preview live-wired and
      brand-curated (health/wellness lane, content/theme-based). Verified live on the site.
- [x] **Homepage image slimmed** — pulled out of inline base64 into
      `assets/illuminations-plate.jpg`. Homepage 210 KB → 61 KB. Same image, now cacheable.
- [x] **Deploy** — repo `github.com/Reyngoe/SHEH-SITE-2` → **Cloudflare** (Git-connected;
      build command blank, output `/`) → **shehthrive.org** (DNS + SSL on Cloudflare; old
      Squarespace records cleared). Every push to `main` auto-deploys.
- [x] **Email signup — WIRED & TESTED.** "Become a SHEH" box posts to MailerLite →
      **SHEH Content** group. Custom design kept, hidden-iframe submit (stays on page),
      honeypot for bots, custom success line. Live-tested working.
- [x] **Email signup on Site 1 (.com) too** — mirrored with a second MailerLite form →
      **SHEH Marketplace** group. One account, two forms, two groups, deduped overlap.
      (Site 1 lives in the separate `SHEH-Website` repo.)

## SHORT-TERM (open — next up)
- [ ] **MailerLite welcome email.** New signups currently hear nothing after joining. Set a
      welcome automation (trigger: joins group → send). Applies to both groups. Cheapest
      retention move — do this first.
- [ ] **Verify `www.shehthrive.org` resolves.** Add the `www` custom domain in Cloudflare if
      not already (bare domain works; this is belt-and-suspenders).
- [ ] **Double opt-in wording.** If double opt-in is ON in MailerLite, reword the "You're in"
      success line to prompt the email-confirmation click. If OFF on both sites, no change.
- [ ] **Manuscripts interior page** (philosophy / field notes / from the road). Text-only —
      the fastest room to fill. Re-link its card/status line when built.
- [ ] **Illuminations interior gallery + real photos.** Kills the "coming soon" feel; brand's
      visual proof.
- [ ] **The Long Take interior reel.** Swap the decorative play button for a real video embed
      when there's footage.
  Note: the three rooms above are gated on CONTENT you make — the build is fast, the writing/
  shooting is the real bottleneck.

## LONGER-TERM (bigger lanes)
- [ ] **Site 1 storefront (shehthrive.com) — turn the marketplace from brand-and-signup into
      actually selling.** Products first (patches / apparel), payments, and the seller's-permit
      groundwork (free / same-day via CDTFA; legal trigger = first paid sale). Lives in the
      `SHEH-Website` repo. This is the revenue lane.
- [ ] **Bars** — deferred far down the timeline (California cottage-food law complexity).
- [ ] **Provisions / supplement concept** — parked pending product dev + IP groundwork.

## OPTIONAL / NICE-TO-HAVE
- [ ] Footer "Our Story" / "The Creed" currently jump to the door panels; could point straight
      to the room pages.
- [ ] **Old Man Roy** AI chatbot (separate project; shares the Worker + API engine).
