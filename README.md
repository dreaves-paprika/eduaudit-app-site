# eduaudit.app — pre-launch teaser site

Pre-launch marketing / **waitlist** site for **EDU Audit+**, the K-12 technology
audit iOS app. Built with Astro + Tailwind on Cloudflare Workers (Static Assets),
same architecture as the edumileage.app site.

> **🟢 Status (2026-06-20): LIVE at https://eduaudit.app.** Deployed via **manual
> `npm run build && npx wrangler deploy`** — this Worker is **not** Git-connected to
> Cloudflare Workers Builds yet, so `git push` does NOT deploy it. See `SITE_PLAN.md`
> for full context and remaining tasks.

## Local development

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to ./dist
npm run preview  # serves the production build locally
```

## Purpose

EDU Audit+ is **pre-launch** (app v0.4.1, no App Store listing yet). This site's
single job is to **start collecting interest + analytics** ahead of launch:

- Waitlist email capture (Hero + final CTA) → Cloudflare KV + Loops
- GA4 + Microsoft Clarity + Cloudflare Web Analytics (RUM)

No App Store download, screenshots, demo video, or pricing — those land at launch.

## ⚠️ Remaining placeholders / pending setup

The site is live and already collects (waitlist → KV + Cloudflare RUM). These remain;
the site runs fine without them — analytics stay guarded off until real IDs are filled:

| Placeholder | Where | Replace with |
|---|---|---|
| `G-XXXXXXXXXX` | `src/layouts/Layout.astro` | real GA4 measurement ID (new "EDU Audit+" property) |
| `CLARITY_PROJECT_ID` | `src/layouts/Layout.astro` | real Microsoft Clarity project id |
| `CF_BEACON_TOKEN` | `src/layouts/Layout.astro` | eduaudit Cloudflare Web Analytics beacon token (RUM is also auto-injected at the edge today) |
| `LOOPS_API_KEY` | Worker secret | `npx wrangler secret put LOOPS_API_KEY` (welcome email) |

✅ **Done:** KV namespace `eduaudit-waitlist` created (`7d6470fa4ded48eb8e798540d54e9a17`)
and bound in `wrangler.jsonc`.

Also before public launch: flip the CSP from Report-Only to enforced + hash-pinned
(see `_headers` and `src/worker.ts`).

## Project structure

```
src/
  components/      # Astro components, one per section
  layouts/         # Base HTML layout (analytics live here)
  pages/
    index.astro    # The single teaser page
  worker.ts        # Cloudflare Worker: /api/notify waitlist + security headers
public/
  icon.png         # 1024×1024 app icon (from the EDU Audit+ asset catalog)
  favicon.png      # 256×256 favicon
```

## Sections (in order)

1. **Hero** — headline + value prop + inline waitlist form
2. **Audience** — who it's for
3. **Features** — key feature grid
4. **HowItWorks** — Scan → Track → Export
5. **Security** — offline / on-device / role-based / FERPA-NIST-aligned trust block
6. **FAQ** — pre-launch questions
7. **CTA** — final waitlist capture
8. **Footer** — links to EDU Plus Apps support/privacy

## Email capture

The waitlist form posts to `/api/notify`, handled by `src/worker.ts`. Submissions
are written to the KV namespace bound as `WAITLIST` and a contact is created in
Loops (`source: 'eduaudit-waitlist'`). Hardening mirrors the mileage site:
origin/referer check, per-IP rate limit, honeypot, 2 KB body cap, security headers.

## Deployment

**Currently manual** (this Worker is not Git-connected to Cloudflare Workers Builds):

```bash
npm run build && npx wrangler deploy   # token auth via CLOUDFLARE_API_TOKEN
```

Serves at https://eduaudit.app + https://www.eduaudit.app via the custom domain binding
on the `eduaudit-app-site` Worker. **Recommended:** connect Git integration in the
Cloudflare dashboard (deploy command `npm run build && npx wrangler deploy`) so it
deploys on `git push` like edumileage/eduplusapps.
