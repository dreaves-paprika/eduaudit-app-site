/**
 * Cloudflare Worker entry — handles /api/notify POST for the pre-launch
 * waitlist and proxies everything else to the static asset bundle
 * built by Astro into ./dist.
 *
 * Hardening:
 *  - Origin / Referer must match the site host
 *  - Per-IP rate limit (one write per 60 seconds, KV-backed)
 *  - Honeypot field rejects naive bots
 *  - Form payload capped at 2 KB
 *  - Security headers added to all responses
 *
 * NOTE (pre-launch): CSP is Report-Only here so placeholder analytics don't get
 * blocked during review. Tighten to an enforced, hash-pinned policy before the
 * public launch — see README "Pre-launch tasks".
 */

interface Env {
  ASSETS: Fetcher;
  WAITLIST: KVNamespace;
  LOOPS_API_KEY: string;
}

const ALLOWED_HOSTS = new Set(['eduaudit.app', 'www.eduaudit.app']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY_BYTES = 2 * 1024;
const RATE_LIMIT_WINDOW_SECONDS = 60; // Cloudflare KV minimum TTL is 60s

const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), interest-cohort=()',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy-Report-Only':
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https:; " +
    "img-src 'self' data: https:; " +
    "style-src 'self' 'unsafe-inline'; " +
    "connect-src 'self' https:; " +
    "object-src 'none'; " +
    "base-uri 'none'; " +
    "frame-ancestors 'none'; " +
    "upgrade-insecure-requests;",
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    let response: Response;

    if (url.pathname === '/api/notify' && request.method === 'POST') {
      response = await handleNotify(request, env, ctx);
    } else {
      response = await env.ASSETS.fetch(request);
    }

    return withSecurityHeaders(response);
  },
};

async function handleNotify(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (!isAllowedOrigin(request)) {
    return redirect(request.url, '?notified=error');
  }

  const lenHeader = request.headers.get('content-length');
  if (lenHeader && Number(lenHeader) > MAX_BODY_BYTES) {
    return redirect(request.url, '?notified=error');
  }

  // Per-IP rate limit — KV TTL key keyed by IP.
  const ip = request.headers.get('cf-connecting-ip') ?? '';
  const rateKey = `ratelimit::${ip}`;
  if (ip) {
    const recent = await env.WAITLIST.get(rateKey);
    if (recent !== null) {
      return redirect(request.url, '?notified=error');
    }
  }

  let email = '';
  let honeypot = '';

  try {
    const formData = await request.formData();
    const rawEmail = formData.get('email');
    const rawHoney = formData.get('website'); // honeypot — real users leave it empty
    if (typeof rawEmail === 'string') email = rawEmail.trim().toLowerCase();
    if (typeof rawHoney === 'string') honeypot = rawHoney.trim();
  } catch {
    return redirect(request.url, '?notified=error');
  }

  // Bots fill every field; humans never see this one.
  if (honeypot.length > 0) {
    return redirect(request.url, '?notified=ok#waitlist');
  }

  if (!email || email.length > 320 || !EMAIL_RE.test(email)) {
    return redirect(request.url, '?notified=error');
  }

  const timestamp = new Date().toISOString();
  const cf = (request as Request & { cf?: { country?: string } }).cf ?? {};
  const record = {
    email,
    timestamp,
    country: cf.country ?? '',
    userAgent: request.headers.get('user-agent') ?? '',
    referer: request.headers.get('referer') ?? '',
  };

  const key = `${timestamp}::${email}`;

  try {
    await env.WAITLIST.put(key, JSON.stringify(record));
  } catch {
    return redirect(request.url, '?notified=error');
  }

  // Rate limit write is best-effort — never blocks a successful signup.
  if (ip) {
    env.WAITLIST.put(rateKey, '1', { expirationTtl: RATE_LIMIT_WINDOW_SECONDS }).catch(() => {});
  }

  // Create contact in Loops — triggers the "Contact added" Loop (welcome email).
  if (env.LOOPS_API_KEY) {
    ctx.waitUntil(
      fetch('https://app.loops.so/api/v1/contacts/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.LOOPS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, source: 'eduaudit-waitlist' }),
      }).catch(() => {}),
    );
  }

  return redirect(request.url, '?notified=ok#waitlist');
}

function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (ALLOWED_HOSTS.has(new URL(origin).host)) return true;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      if (ALLOWED_HOSTS.has(new URL(referer).host)) return true;
    } catch {
      return false;
    }
  }

  return false;
}

function redirect(currentUrl: string, search: string): Response {
  const dest = new URL(currentUrl);
  dest.pathname = '/';
  dest.search = '';
  dest.hash = '';

  const queryPart = search.split('#')[0] ?? '';
  const hashPart = search.includes('#') ? search.split('#')[1] : '';

  if (queryPart && queryPart.startsWith('?')) {
    dest.search = queryPart.slice(1);
  }
  if (hashPart) {
    dest.hash = hashPart;
  }

  return Response.redirect(dest.toString(), 303);
}

function withSecurityHeaders(response: Response): Response {
  const clone = new Response(response.body, response);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    clone.headers.set(name, value);
  }
  return clone;
}
