# Spec — ch23: Production Hardening (PROPOSAL / DRAFT — confirm with Oleg before building)

**Status:** DRAFT, like ch21/ch22. Opens **Wave 6 (Production)**. ch23 is mostly **backend**, with concrete, gated
deliverables (unlike ch22's audit shape), but the exact set of hardening measures is a scope decision — see OPEN DECISIONS.

**Type:** new forward chapter. **Theme:** take the working app and make it production-safe and production-fast on the
server side — caching, compression, rate-limiting, security headers, and secrets — each a small, real, verifiable seam.

## Goal

Cash in the seams built across ch04–ch20 by hardening the API: cache the expensive aggregation (`/stats` — flagged as an
OutputCaching candidate back in ch18), compress responses, rate-limit auth + write endpoints, add security headers, and
move secrets out of `appsettings`. Teach each as "what attack/cost it prevents, the one-liner that adds it, how to verify".

## OPEN DECISIONS (confirm with Oleg)

1. **Which measures** (proposal = all five, each small): (a) **OutputCaching** on `GET /api/projects/{id}/stats` (the ch18
   candidate) with a short TTL + tag-based eviction on issue writes; (b) **response compression** (Brotli/Gzip);
   (c) **rate limiting** (`AddRateLimiter` — a fixed/sliding window on `/auth/login` + maybe global); (d) **security
   headers** (a small middleware: `X-Content-Type-Options`, `Referrer-Policy`, a basic CSP note, HSTS-in-prod); (e)
   **secrets** (JWT key out of `appsettings.json` into user-secrets/env + fail-fast if missing). Confirm the set + depth.
2. **Caching correctness** — OutputCaching with eviction is the interesting lesson (stale stats after creating an issue).
   Use cache **tags** + evict on write (the issue/comment/reorder handlers `IOutputCacheStore.EvictByTagAsync`), or keep
   it dead-simple with a short TTL only? Proposal: tag-based eviction (the real-world-correct version; great interview content).
3. **Rate limiting scope** — just `/auth/login` (brute-force defense, clearest lesson) or a global limiter too? Proposal:
   a named limiter on login + a lenient global one; teach 429 + `Retry-After`.
4. **Frontend touch?** — mostly none, but the error interceptor (ch11) should handle **429** gracefully (a friendly
   toast). Small client change. Confirm whether to include it (proposal: yes, one tiny interceptor branch).
5. **Verifiability** — all of these are curl/integration-testable: cached response (timing + a header), gzip
   (`Content-Encoding`), 429 after N logins, headers present, missing-secret fail-fast. Confirm we lean on curl smoke +
   maybe extend the ch21 xUnit suite with a rate-limit/caching test.

## Backend (`reference/ch23/server/...`) — proposed

- **OutputCaching**: `AddOutputCache` + a policy for `/stats` (TTL ~10-30s, vary-by project + auth); the issue/comment/
  reorder write handlers call `IOutputCacheStore.EvictByTagAsync("stats-{projectId}")`. Region `step-23.x`. The big lesson:
  caching is easy; **invalidation** is the hard part — show stale-then-fresh.
- **Response compression**: `AddResponseCompression` (Brotli + Gzip) + `UseResponseCompression`.
- **Rate limiting**: `AddRateLimiter` with a fixed-window policy on the auth group; return 429 + `Retry-After`.
- **Security headers**: a tiny middleware adding the standard headers; HSTS only in production.
- **Secrets**: move `Jwt:Key` to user-secrets/env; `Program.cs` fail-fast (the existing `?? throw` already models this) —
  document the dev (user-secrets) vs prod (env/key-vault) story; ensure no real secret sits in committed `appsettings`.
- Optionally extend `TaskForge.Tests` (ch21) with a caching/eviction or rate-limit integration test (gated `dotnet test`).
- `milestones.json` += ch23 dotnet.

## Frontend

Minimal: the ch11 `error.interceptor` gains a **429** branch (a "slow down, try again" toast reading `Retry-After`).
`milestones.json` += ch23 ng only if the client changes (it does, slightly).

## Architecture / teaching core

Each measure is a "production seam": a one-liner of policy + the mental model of the threat/cost it addresses. The
OutputCaching + tag-eviction pair is the centerpiece (caching is trivial, invalidation is the real engineering). Interview
gold: cache invalidation, rate-limit algorithms (fixed vs sliding vs token bucket), why secrets never live in source,
defense-in-depth headers.

## Live demo

A "cache + invalidation" demo: a fake `/stats` call with a visible TTL countdown + a hit/miss indicator; a "create issue"
button that evicts the tag and forces a refetch — showing the stale-window then the eviction. Timers cleaned in DestroyRef.
(Or a rate-limit demo: hammer a fake login, watch it 429 with a Retry-After countdown.)

## Teaching outline (~16 steps, proposed)

Production checklist intro; OutputCaching on /stats; cache tags + eviction-on-write (the hard part); response compression;
rate limiting (algorithms + 429 + Retry-After); the client 429 toast; security headers + HSTS; secrets (user-secrets vs
env vs key-vault, fail-fast); what's still missing (CORS already done ch11, HTTPS, logging/observability tease for ch25).
Quiz ≥6, proveIt ≥4 (cached stats served without hitting the DB + evicted after a write; gzip Content-Encoding; 429 after
N logins; missing secret fails fast), exercise (cache another endpoint or add a global limiter), terms ≥6 (output caching,
cache invalidation/tags, response compression, rate limiting, token bucket, security headers, HSTS, user-secrets).

## Verification

- Snapshot compiles (dotnet incl. any test; ng if client changes). Gates green. Two-server smoke: `/stats` cached
  (fast + cache header) then evicted after creating an issue (fresh numbers); `Content-Encoding: br/gzip`; 429 after
  hammering login; security headers present; app still fully works; dual-width clean; 0 console errors.

## Done when

Decisions confirmed → snapshot built + verified + content (delegable) + gates + review + commit + progress log. Then
ch24 Realtime (SignalR), ch25 Ship (Docker/CI/deploy), ch26 Capstone — each needs its own spec.
