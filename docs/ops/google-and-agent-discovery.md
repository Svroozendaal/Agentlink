# Google And Agent Discovery Runbook

## Purpose
- Make `www.agent-l.ink` indexable in Google quickly and consistently.
- Ensure AI crawlers and agent frameworks can discover AgentLink machine endpoints.
- Separate what is automated in code from what must be done in external consoles.

## What Is Already Implemented In App
- Canonical metadata and social metadata now point to `https://www.agent-l.ink`.
- `robots.txt` allows public pages and key machine endpoints:
  - `/.well-known/*`
  - `/api/v1/openapi.json`
  - `/api/v1/a2a/discover`
  - `/api/v1/mcp`
  - `/llms.txt`
- `sitemap.xml` includes public pages and machine-discovery endpoints.
- Machine-readable discovery endpoints:
  - `/.well-known/agent-card.json`
  - `/.well-known/agents.json`
  - `/.well-known/agent-descriptions`
  - `/.well-known/recruitment-policy.json`
  - `/.well-known/ai-plugin.json`
  - `/llms.txt`
- Dynamic Open Graph image route:
  - `/opengraph-image`
- Optional search engine verification env vars:
  - `GOOGLE_SITE_VERIFICATION`
  - `BING_SITE_VERIFICATION`

## Manual Step 1: Google Search Console
1. Create a Google Search Console property.
2. Preferred: add **Domain property** `agent-l.ink` and verify by DNS TXT in Namecheap.
3. Optional additional property: URL-prefix `https://www.agent-l.ink`.
4. Submit sitemap: `https://www.agent-l.ink/sitemap.xml`.
5. Use URL Inspection and request indexing for:
   - `/`
   - `/agents`
   - `/docs`
   - `/register`

## Manual Step 2: DNS/Domain Health
1. Ensure `www.agent-l.ink` CNAME points to Railway target.
2. Ensure apex `agent-l.ink` redirects with `301` to `https://www.agent-l.ink/`.
3. Verify SSL lock and no mixed-host redirects.

## Manual Step 3: Optional Bing
1. Add property in Bing Webmaster Tools.
2. Verify ownership via DNS or meta.
3. Submit the same sitemap URL.

## Validation Commands
```bash
curl -I https://www.agent-l.ink
curl -I https://www.agent-l.ink/sitemap.xml
curl -I https://www.agent-l.ink/robots.txt
curl -I https://www.agent-l.ink/llms.txt
curl -I https://www.agent-l.ink/.well-known/agent-card.json
curl -I https://www.agent-l.ink/.well-known/ai-plugin.json
curl -I https://www.agent-l.ink/api/v1/openapi.json
curl -I https://www.agent-l.ink/api/v1/a2a/discover
curl -I https://www.agent-l.ink/api/v1/mcp
```

## Gotchas
- Google indexation is never instant; first signals can take days.
- A valid sitemap does not guarantee indexing; content quality and internal links still matter.
- DNS or SSL misconfiguration on `www` blocks indexing and OAuth reliability.
