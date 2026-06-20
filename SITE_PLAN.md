# EDU Audit+ — Pre-Launch Teaser Site · Plan & Build Documentation

> **Purpose of this file:** a complete, self-contained record of what this site is,
> why it exists, how it's built, what's done, and what's left — so a brand-new
> session (or a new collaborator) can pick this up with full context. Last updated
> **2026-06-20** (site went live).

---

## 0. TL;DR

This repo (`eduaudit-app-site`) is the **pre-launch teaser / waitlist website** for
**EDU Audit+**, a K-12 school technology-audit iOS app (sibling of EDU Mileage+).
The app is **v0.4.1, pre-launch** — no App Store listing yet. The site's only job
is to **start collecting information ahead of launch**: a waitlist email capture +
analytics (GA4, Microsoft Clarity, Cloudflare Web Analytics).

It was built to deliberately **mirror the edumileage.app site's architecture**
(Astro + Tailwind + Cloudflare Worker). **As of 2026-06-20 it is LIVE at eduaudit.app
and collecting** — see the status update immediately below.

---

## 🟢 STATUS UPDATE — 2026-06-20: SITE IS LIVE

- ✅ Live at https://eduaudit.app and https://www.eduaudit.app (verified).
- ✅ Waitlist works end-to-end: form → `/api/notify` Worker → **KV `eduaudit-waitlist`**
  (id `7d6470fa4ded48eb8e798540d54e9a17`). Verified with a test submit, then cleaned up.
- ✅ Cloudflare RUM auto-collects (it already did on the stub).
- ✅ Copy future-proofed for planned Phase-2 cloud sync (offline kept; absolute
  "no servers / data stays on device" claims softened to "you control your data").

**Deploy reality — correction to §4's assumption:** the `eduaudit-app-site` Worker is
**NOT connected to Cloudflare Workers Builds / git auto-deploy** (unlike edumileage +
eduplusapps). A `git push` to `main` does **nothing** for it. It was — and still is —
deployed by a **manual `wrangler deploy`** (token auth). The code is on `main`, but to
deploy updates you currently run `npm run build && npx wrangler deploy`. *(Recommended:
connect Git integration in the Cloudflare dashboard so it matches the other two sites.)*

**Still pending (do NOT block the live site, but finish for full function):**
1. **Loops welcome email** — set `LOOPS_API_KEY` secret (`npx wrangler secret put LOOPS_API_KEY`).
   Until then signups save to KV but no email is sent.
2. **GA4 + Clarity** — create the property/project, paste IDs into `Layout.astro`, redeploy.
   (Analytics are guarded off while placeholders remain — nothing breaks meanwhile.)
3. **Git integration** — connect the repo in Cloudflare Workers Builds (deploy command
   `npm run build && npx wrangler deploy`) for push-to-deploy.
4. **Harden CSP** — flip Report-Only → enforced + hash-pinned once analytics IDs are final.
5. **OG image / screenshots** — designed OG; app screenshots when available.

---

## 1. Why this site exists (the data behind the decision)

On 2026-06-18 we reviewed real analytics across the three EDU Plus Apps sites.
**Cloudflare RUM (real humans, not bots), last 30 days:**

| Site | RUM pageloads |
|---|---|
| **eduaudit.app** | **40** ← traffic leader |
| eduplusapps.com | 10 |
| edumileage.app | ~2 (7d) |

EDU Audit+ is getting the most real human web interest of the three — but the
eduaudit.app site was only a static "Coming Soon" splash with **no GA4 and no
Clarity** (its 40 RUM pageloads came purely from Cloudflare's edge-injected beacon).
We had traffic but almost no insight into *who* or *from where*. **This site fixes
that** by adding the full data-collection stack and a waitlist, so we can learn from
and convert the interest that's already arriving.

---

## 2. What EDU Audit+ is (the app)

Source: `~/Projects/edu-audit-plus/` (app v0.4.1, build 1, iOS 16+, Swift, pre-App-Store).

- **One-liner:** the simplest way to audit and manage K-12 technology inventory.
- **What it does:** scan asset-tag barcodes + read serial numbers via camera OCR,
  record device details/condition across multiple school sites, and export
  audit-ready reports — **fully offline, on-device, no backend required.**
- **Audience:** technology coordinators, IT directors, device auditors, and district
  administrators in K-12 districts.
- **Key features (real app screens):** Scan tab (barcode + OCR), Records tab, Search
  tab (live filter by site/type/manufacturer), Admin tab (District Summary, Manage
  Users, Manage Lists, Branding, Security Settings, Export & Print), role-based access
  (Super Admin / Admin / Auditor / Read-Only, PIN login), duplicate detection,
  CSV export (Standard + AssetTiger formats), AirPrint reports, district branding,
  full audit trail (auditedBy/dateAudited + edit history).
- **Security posture:** offline + on-device, role-based access, configurable session
  timeouts, built with FERPA in mind, aligned to NIST SP 800-63B.
- **Pricing:** **NOT defined anywhere** in the app yet. The site therefore shows **no
  pricing** — the waitlist is the conversion point.
- **In-app display name:** "Audit+". **Public/marketing name chosen for this site:**
  "EDU Audit+" (for consistency with EDU Mileage+ and the eduaudit.app domain). ← see
  open decisions, §11.

---

## 3. Goals & scope

**Goal:** start collecting information pre-launch — (a) waitlist emails, (b) analytics.

**In scope (built):** full single-page teaser site, waitlist capture, analytics wiring.

**Explicitly OUT of scope (because the app isn't launched):** App Store download
button, Smart App Banner, screenshots, demo video, pricing section, `SoftwareApplication`
offers. These come at launch.

---

## 4. Architecture (mirrors edumileage.app)

- **Framework:** Astro 6 + Tailwind 3 (`@astrojs/tailwind`) + `@astrojs/sitemap`.
- **Hosting:** Cloudflare Worker (`src/worker.ts`) serves the static `./dist` bundle
  **and** handles the `POST /api/notify` waitlist endpoint.
- **Deploy model:** `git push` to `main` → GitHub (`dreaves-paprika/eduaudit-app-site`)
  → Cloudflare Workers Git integration auto-builds (`npm run build`, output `dist`).
  *(Git integration + custom domain still need to be connected — see §10.)*
- **`.npmrc`** contains `legacy-peer-deps=true` — required because `@astrojs/tailwind@6`
  only declares peer support up to Astro 5, though it works fine with Astro 6 (the
  mileage site runs the identical combo in production).

### File map
```
eduaudit-app-site/
  package.json, astro.config.mjs, tailwind.config.mjs, tsconfig.json
  wrangler.jsonc          # Worker name, assets dir, KV binding, nodejs_compat
  .npmrc                  # legacy-peer-deps=true
  README.md               # dev/build/deploy + placeholder table
  SITE_PLAN.md            # this file
  src/
    layouts/Layout.astro  # <head>: analytics + meta + JSON-LD
    pages/index.astro     # composes the sections
    components/
      WaitlistForm.astro  # reused in Hero + CTA; posts to /api/notify
      Nav, Hero, Audience, Features, HowItWorks, Security, FAQ, CTA, Footer
    worker.ts             # /api/notify waitlist + security headers
  public/
    icon.png (1024, from app icon)  favicon.png (256)  og-image.png (1200×630 placeholder)
    robots.txt  _headers
```

---

## 5. Analytics / data-collection stack

All three live in `src/layouts/Layout.astro`, mirroring edumileage:

| Tool | Status | Notes |
|---|---|---|
| **GA4** | placeholder `G-XXXXXXXXXX` | needs a **new** "EDU Audit+" property (do NOT reuse mileage's `G-786E2RTYD6`) |
| **Microsoft Clarity** | placeholder `CLARITY_PROJECT_ID` | needs a **new** Clarity project |
| **Cloudflare RUM** | already collecting (edge auto-inject) | optional explicit beacon token placeholder `CF_BEACON_TOKEN` |

**Important design choice:** the GA4/Clarity/beacon `<script>` tags are wrapped in an
`analyticsLive` guard that is **false while the IDs are placeholders** — so the page
builds and previews with **zero broken third-party requests**. The moment real IDs are
filled in, the guard flips true and analytics activate. A `cta_click` GA event fires on
any element with `data-ga-label` (nav, hero, waitlist submit).

---

## 6. Waitlist mechanism

- `WaitlistForm.astro` posts `email` (+ honeypot `website`) to `POST /api/notify`.
- `src/worker.ts` handles it: origin/referer check → 2 KB body cap → per-IP KV rate
  limit (60s) → honeypot → email validation → write to KV namespace `WAITLIST` →
  create Loops contact (`source: 'eduaudit-waitlist'`) → redirect back with
  `?notified=ok|error`. A small client script reflects that as a success/error message.
- **Reuses the existing Loops account** (same `LOOPS_API_KEY` secret pattern as mileage),
  just a different `source` tag.

---

## 7. Site structure & content (sections, in order)

1. **Hero** — "School technology audits, simplified." + inline waitlist form + app icon
   with floating "audit record" glass cards (illustrative sample data).
2. **Audience** — who it's for (tech coordinators / IT directors / auditors / admins).
3. **Features** — 8-card grid (scan, multi-site, search, RBAC, export, AirPrint,
   duplicate detection, branding).
4. **HowItWorks** — Scan → Track → Export.
5. **Security** — dark trust block (offline, on-device, RBAC, session security, FERPA/NIST).
6. **FAQ** — 8 pre-launch questions (what is it / when / cost / devices / offline /
   security / roles / early access) + FAQPage JSON-LD.
7. **CTA** — final waitlist capture (`#waitlist`).
8. **Footer** — links to EDU Plus Apps support/privacy/etc.

---

## 8. Branding decisions

- **Color:** navy → blue `brand` palette in `tailwind.config.mjs`, chosen to match the
  **app icon** (magnifying glass on a navy-to-blue gradient). This intentionally
  differs from EDU Mileage+'s teal. *(The app's configurable default primary is red
  `#BA0C2F`, but that's a district-customizable default, not the icon identity.)*
- **Icon/favicon:** pulled directly from the app's `AppIcon.png` (1024px).
- **Voice:** plain, practical, IT-buyer-aware ("survives a procurement review").

---

## 9. Status — what's DONE (2026-06-18)

- ✅ Full Astro site scaffolded, all 9 components + layout + page + worker written.
- ✅ Analytics stack wired with safe placeholders (guarded so nothing breaks in preview).
- ✅ Waitlist form (hero + CTA) + hardened Worker endpoint.
- ✅ App icon → site icon + favicon; placeholder OG image (1200×630).
- ✅ `npm install` + `npm run build` succeed cleanly (1 page + sitemap).
- ✅ Old "Coming Soon" stub `index.html` removed (recoverable from git history).
- ⏸️ **Committed to branch `prelaunch-teaser` only — NOT pushed, NOT deployed.** `main`
  still holds the old stub, so the live site is unchanged pending review.

---

## 10. PENDING — the task list (what's left, and who/how)

**A. Provisioning (needed for data collection to actually work):**
1. Create **GA4 property** "EDU Audit+" (account `393327129`) → paste measurement ID
   into `src/layouts/Layout.astro` (`GA4_ID`). *Claude can do this via Chrome (logged
   into GA4) on your OK, or you create it.*
2. Create **Microsoft Clarity** project for eduaudit → paste ID into `Layout.astro`
   (`CLARITY_ID`). *Same — Chrome with your OK, or you.*
3. Get the **Cloudflare RUM beacon token** for eduaudit.app → `Layout.astro`
   (`CF_BEACON_TOKEN`). *(Optional: RUM already auto-injects at the edge.)*
4. Create **Cloudflare KV namespace**: `npx wrangler kv namespace create eduaudit-waitlist`
   → paste id into `wrangler.jsonc`. *(Needs a Cloudflare token with write / `wrangler
   login`; the stored analytics token is read-only.)*
5. Set the **Loops secret**: `npx wrangler secret put LOOPS_API_KEY` (reuse existing
   key). Optionally build a Loops welcome sequence for `source: eduaudit-waitlist`.

**B. Deploy (do ONLY after owner review):**
6. Connect **Cloudflare Workers Git integration** to `dreaves-paprika/eduaudit-app-site`
   (build `npm run build`, output `dist`) + bind custom domain `eduaudit.app` + `www`.
7. Merge `prelaunch-teaser` → `main` and push → triggers the deploy.

**C. Hardening / polish (before or shortly after public launch):**
8. Flip CSP from **Report-Only → enforced + hash-pinned** (`_headers` + `worker.ts`).
9. Replace the placeholder **OG image** with a designed 1200×630 (icon + headline).
10. Add **screenshots / app preview** once the app has shippable ones.

---

## 11. Open decisions for owner review

- **Product name:** site uses **"EDU Audit+"** (family consistency); the app's in-app
  name is "Audit+". Confirm or change.
- **Brand color:** navy/blue (matches icon) vs the app's red default. Confirm.
- **Copy accuracy:** verify the security claims wording (FERPA "in mind", NIST 800-63B
  "aligned"), feature names, and the "Built by the team behind EDU Mileage+" line.
- **Hero sample data:** "MacBook Air M3 / Lincoln Elementary / 248 devices" is
  illustrative — confirm it reads as obviously sample, not a real customer.
- **Contact email:** site uses `hello@eduplusapps.com`. Confirm vs `support@`.

---

## 12. How to preview / build / deploy

```bash
cd ~/Projects/eduaudit-app-site
npm install            # uses .npmrc legacy-peer-deps
npm run dev            # http://localhost:4321 (live reload)
npm run build          # -> ./dist
npm run preview        # serves the production build at http://localhost:4321
```
Deploy = push to `main` once Git integration is connected (§10). The waitlist won't
function in local `dev`/`preview` (no KV/Loops bindings) — the page renders, but
`/api/notify` only works on the deployed Worker.

---

## 13. Cross-references

- **Template site:** `~/Projects/edumileage-app-site/` (the architecture this mirrors).
- **Umbrella site:** `~/Projects/eduplusapps-site/` (legal pages live here; footer links to them).
- **The app:** `~/Projects/edu-audit-plus/` (v0.4.1; `CHANGELOG.md`, `Assets.xcassets/AppIcon.appiconset`).
- **GitHub:** `git@github.com:dreaves-paprika/eduaudit-app-site.git`.
- **Analytics accounts:** GA4 account `393327129`; existing Loops account (Worker secret
  `LOOPS_API_KEY`); Cloudflare zone for eduaudit.app already exists (RUM active).
- **Session context:** built 2026-06-18 in the same session that (a) set up working
  App Store Connect API access for EDU Mileage+, and (b) confirmed eduaudit as the
  web-traffic leader, which motivated this site.
