# eduaudit.app — pre-launch teaser site

Pre-launch marketing / **waitlist** site for **EDU Audit+**, the K-12 technology
audit iOS app. Built with Astro + Tailwind, deployed to Cloudflare Workers
(Static Assets) on push to `main`. Same architecture as the edumileage.app site.

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

## ⚠️ Pre-launch tasks (placeholders to fill before deploy)

These are intentionally left as obvious placeholders; the site builds and previews
fine without them, but data collection / waitlist won't work until they're set:

| Placeholder | Where | Replace with |
|---|---|---|
| `G-XXXXXXXXXX` | `src/layouts/Layout.astro` | real GA4 measurement ID (new "EDU Audit+" property) |
| `CLARITY_PROJECT_ID` | `src/layouts/Layout.astro` | real Microsoft Clarity project id |
| `CF_BEACON_TOKEN` | `src/layouts/Layout.astro` | eduaudit Cloudflare Web Analytics beacon token (RUM is also auto-injected at the edge today) |
| `REPLACE_WITH_EDUAUDIT_WAITLIST_KV_ID` | `wrangler.jsonc` | `npx wrangler kv namespace create eduaudit-waitlist` |
| `LOOPS_API_KEY` | Worker secret | `npx wrangler secret put LOOPS_API_KEY` |

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

Connected (to be set up) to Cloudflare Workers via Git integration on
`dreaves-paprika/eduaudit-app-site`. Build command `npm run build`, output `dist`.
Serves at https://eduaudit.app via custom domain binding on the Worker.
