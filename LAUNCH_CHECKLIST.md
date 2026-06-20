# EDU Audit+ teaser — Remaining Setup, Step by Step

> The site is **already live and collecting** at https://eduaudit.app (waitlist → KV,
> Cloudflare RUM). Everything below is **enrichment**, not required for the site to run.
> Do them in any order. Created 2026-06-20.
>
> ⚠️ This repo is **public** — never commit the Cloudflare API token or the Loops key.
> Identifiers below (account id, KV id) are not secrets.

**Shortcut:** you can skip all the editing and just send Claude three values — the
**GA4 Measurement ID**, the **Clarity Project ID**, and the **Loops API key** — and
Claude will make every edit, set the secret, redeploy, and verify. The manual steps
are here for when you'd rather do it yourself or there's no session running.

---

## Reference values (not secret)

| Thing | Value |
|---|---|
| Cloudflare account id | `16c72c97ec473095cb385ee8889a343c` |
| Worker name | `eduaudit-app-site` |
| KV namespace (waitlist) | `eduaudit-waitlist` = `7d6470fa4ded48eb8e798540d54e9a17` |
| Repo | `dreaves-paprika/eduaudit-app-site` (public) |
| Cloudflare API token | "Claude Code — Full Management" — in your password manager / notes. **Do not paste into this file.** |

---

## 🔁 The redeploy procedure (used by several steps below)

This Worker is **not** Git-connected yet, so deploys are manual until Step 5:

```bash
cd ~/Projects/eduaudit-app-site
export CLOUDFLARE_API_TOKEN='<your Full Management token>'
export CLOUDFLARE_ACCOUNT_ID='16c72c97ec473095cb385ee8889a343c'
npm run build && npx wrangler deploy
git add -A && git commit -m "describe the change" && git push origin main
```

Verify after deploy:
```bash
curl -s https://eduaudit.app/ | grep -o '<title>[^<]*</title>'   # should be the teaser title
```

---

## Step 1 — Google Analytics 4 (~3 min)

**Create the property + get the Measurement ID**
1. Go to https://analytics.google.com → **Admin** (⚙️ bottom-left).
2. In the **Account** column pick your existing account (or create one), then in the
   **Property** column click **＋ Create → Property**.
3. Property name: `EDU Audit+`. Set reporting time zone + currency → **Next**.
4. Fill business details / objectives (any reasonable choice) → **Create**, accept terms.
5. On **Data collection**, choose platform **Web**. Website URL: `https://eduaudit.app`,
   Stream name: `eduaudit.app` → **Create stream**.
6. Copy the **Measurement ID** at the top of the stream details — format `G-XXXXXXXXXX`.

**Wire it in** — edit `src/layouts/Layout.astro`:
```js
const GA4_ID = 'G-XXXXXXXXXX';   // ← paste your real ID here
```
> ⚠️ Analytics only switch on when **both** GA4 *and* Clarity are set — see this guard
> line in the same file:
> ```js
> const analyticsLive = !GA4_ID.includes('X') && CLARITY_ID !== 'CLARITY_PROJECT_ID';
> ```
> If you set up only one of the two, change the guard to check just that one (or let
> Claude handle it).

**Deploy:** run the redeploy procedure above.
**Verify:** open https://eduaudit.app, then GA4 → **Reports → Realtime** — you should
appear as 1 active user within ~30 sec. Also: `curl -s https://eduaudit.app/ | grep -o 'G-[A-Z0-9]*'`.

---

## Step 2 — Microsoft Clarity (~3 min)

1. Go to https://clarity.microsoft.com → sign in → **＋ New project**.
2. Name `EDU Audit+`, website `eduaudit.app`, category whatever fits → **Create**.
3. Open the project → **Settings → Overview** (or the install snippet). Copy the
   **Project ID** — the 10-character code (e.g. the `"abcde12345"` in
   `clarity.ms/tag/abcde12345`).

**Wire it in** — edit `src/layouts/Layout.astro`:
```js
const CLARITY_ID = 'CLARITY_PROJECT_ID';   // ← paste your real Project ID here
```
**Deploy:** redeploy procedure. **Verify:** load the site, then Clarity dashboard →
sessions should appear within a few minutes (Clarity has a short delay).

---

## Step 3 — Cloudflare RUM beacon (OPTIONAL — already working)

Cloudflare Web Analytics is **already auto-injected at the edge** (that's where the
existing eduaudit pageloads come from), so this is optional. But once Step 1+2 flip
`analyticsLive` on, the explicit beacon tag renders with a placeholder token, which
makes one harmless failed request. Pick one:

- **Recommended — remove the redundant tag.** In `src/layouts/Layout.astro` delete the
  line beginning `<script defer src="https://static.cloudflareinsights.com/beacon.min.js"`
  (and the `CF_BEACON_TOKEN` const). RUM keeps working via edge injection.
- **Or set the real token.** Cloudflare dash → **Analytics → Web Analytics →**
  `eduaudit.app` → copy the beacon **token** → paste into
  `const CF_BEACON_TOKEN = '...';`.

**Deploy:** redeploy procedure.

---

## Step 4 — Loops welcome email (~2 min)

Without this, signups still save to KV — they just don't get an email.

1. Get the key: Loops → **Settings → API** → copy the API key. (Reusing the same Loops
   account as edumileage is fine; eduaudit contacts are tagged `source: eduaudit-waitlist`.)
2. Set it as the Worker secret (takes effect immediately, no redeploy needed):
   ```bash
   cd ~/Projects/eduaudit-app-site
   export CLOUDFLARE_API_TOKEN='<your Full Management token>'
   export CLOUDFLARE_ACCOUNT_ID='16c72c97ec473095cb385ee8889a343c'
   npx wrangler secret put LOOPS_API_KEY
   # paste the Loops key at the prompt
   ```
3. (Optional) In Loops, build a "Contact added" loop / welcome email so new contacts
   actually receive something.

**Verify:** submit a real address on the live site → it should appear as a contact in
Loops (and in the KV namespace).

---

## Step 5 — Git integration (so deploys happen on `git push`)

Right now `git push` does **nothing** for this Worker (unlike edumileage/eduplusapps).
To match them:

1. Cloudflare dash → **Workers & Pages → `eduaudit-app-site` → Settings → Build**.
2. **Connect to Git** → authorize GitHub → pick `dreaves-paprika/eduaudit-app-site`,
   branch `main`.
3. Set the build configuration (⚠️ the quirk: static-asset Workers run the **Deploy
   command**, not the Build command):
   - **Build command:** `npm run build`
   - **Deploy command:** `npm run build && npx wrangler deploy`
   - **Root directory:** default
4. Save. From now on, `git push origin main` auto-builds and deploys — you can stop
   running `npx wrangler deploy` manually.

**Verify:** push a trivial change and watch the build appear in Workers & Pages with the
latest commit message.

---

## Step 6 — Harden CSP (do LAST, after analytics IDs are final)

CSP is currently **Report-Only** (monitor, don't block) in both `public/_headers` and
`src/worker.ts` — correct for pre-launch. To enforce:

1. After GA4 + Clarity IDs are final and deployed, capture the sha256 of each inline
   `<script>` (the GA4 config + Clarity init). Easiest: let Claude compute them, or read
   them from the browser console's CSP-violation reports.
2. In `src/worker.ts` and `public/_headers`, change `Content-Security-Policy-Report-Only`
   → `Content-Security-Policy`, and set
   `script-src 'self' 'sha256-…' 'sha256-…' 'strict-dynamic' https:`.
3. Redeploy. Test every page interaction (waitlist submit, FAQ accordions) for console
   CSP errors before considering it done.

> This step is fiddly — recommended to hand to Claude: "harden the CSP."

---

## Quick verification checklist

- [ ] GA4 Realtime shows you when you load the site
- [ ] Clarity shows a session after a few minutes
- [ ] Cloudflare beacon: redundant tag removed OR real token set
- [ ] Loops: a test signup appears as a contact
- [ ] `git push` triggers a Cloudflare build (Step 5 done)
- [ ] CSP enforced with no console violations (Step 6 done)
- [ ] `eduaudit.app` + `www.eduaudit.app` both serve the teaser (already ✓)
