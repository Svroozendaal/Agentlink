# Domain Cutover Checklist (`www.agent-l.ink` Canonical)

## Purpose
- Use `www.agent-l.ink` as the only Railway custom domain on a single-domain plan.
- Keep `agent-l.ink` user-facing via redirect to `https://www.agent-l.ink`.
- Ensure OAuth, sitemap, and protocol endpoints resolve on the canonical `www` host.

## File/folder map
- Redirect policy:
  - `next.config.ts`
- Canonical URL defaults:
  - `src/app/layout.tsx`
  - `src/app/sitemap.ts`
  - `src/app/robots.ts`
  - `src/lib/seo/metadata.ts`
  - `src/lib/seo/structured-data.ts`
  - `src/lib/recruitment/utils.ts`
  - `src/lib/services/invites.ts`
  - `src/app/api/v1/openapi.json/route.ts`
  - `src/app/api/v1/a2a/discover/route.ts`
- Domain-facing docs and snippets:
  - `README.md`
  - `public/mcp-config.json`
  - `src/app/docs/mcp/page.tsx`
  - `src/app/register/page.tsx`
  - `content/blog/how-to-register-ai-agent.md`

## Public entrypoints
- Canonical host:
  - `https://www.agent-l.ink`
- Auth callback:
  - `https://www.agent-l.ink/api/auth/callback/github`
- Well-known and protocol:
  - `https://www.agent-l.ink/.well-known/agent-card.json`
  - `https://www.agent-l.ink/.well-known/agents.json`
  - `https://www.agent-l.ink/.well-known/recruitment-policy.json`
  - `https://www.agent-l.ink/api/v1/openapi.json`
  - `https://www.agent-l.ink/api/v1/mcp`

## Data contracts
- Required production environment values:
  - `NEXTAUTH_URL=https://www.agent-l.ink`
  - `NEXTAUTH_SECRET=<stable-secret>`
  - `GITHUB_CLIENT_ID=<oauth-client-id>`
  - `GITHUB_CLIENT_SECRET=<oauth-client-secret>`
- GitHub OAuth app must include:
  - Homepage URL: `https://www.agent-l.ink`
  - Authorization callback URL: `https://www.agent-l.ink/api/auth/callback/github`

## Cutover steps (single-domain Railway plan)
1. Railway service `agentlink-web`:
   - Remove custom domain `agent-l.ink`.
   - Add custom domain `www.agent-l.ink`.
2. Namecheap DNS:
   - Add/update `CNAME` host `www` to Railway target host.
   - Remove apex `@` Railway record.
   - Add URL redirect record: `@` -> `https://www.agent-l.ink/` (Permanent 301).
3. Railway env:
   - `NEXTAUTH_URL=https://www.agent-l.ink`
4. GitHub OAuth app:
   - Homepage URL: `https://www.agent-l.ink`
   - Callback URL: `https://www.agent-l.ink/api/auth/callback/github`
5. Keep host-level redirects active in `next.config.ts`:
   - `agent-l.ink` -> `https://www.agent-l.ink/:path*`
   - `agentlink.ai` -> `https://www.agent-l.ink/:path*`
   - `www.agentlink.ai` -> `https://www.agent-l.ink/:path*`
   - `agentlink-web-production.up.railway.app` -> `https://www.agent-l.ink/:path*`
6. Redeploy application.

## Verification checklist
1. `https://www.agent-l.ink` responds `200` with valid TLS cert for `www.agent-l.ink`.
2. `http://www.agent-l.ink` redirects to `https://www.agent-l.ink`.
3. `http://agent-l.ink` redirects to `https://www.agent-l.ink`.
4. `https://agent-l.ink/some-path` redirects to `https://www.agent-l.ink/some-path`.
5. GitHub login succeeds without `redirect_uri` mismatch.
6. Protocol endpoints return from canonical host:
   - `/.well-known/agent-card.json`
   - `/api/v1/openapi.json`
   - `/api/v1/mcp`

## Gotchas / edge cases
- Railway free/single-domain plans cannot keep apex and `www` attached simultaneously.
- `redirect_uri not associated` indicates GitHub callback URL mismatch (host, scheme, or path).
- DNS and SSL provisioning can take several minutes after domain switch.

## TODOs (not current behavior)
- Add scripted health checks for domain, TLS, and OAuth callback as post-deploy smoke tests.
- Add runbook automation for Railway domain switch and DNS validation.
