# SEO And Discoverability Checklist

## Per Public Page
- [ ] Unique `title`
- [ ] Unique meta description
- [ ] Canonical URL
- [ ] Open Graph metadata
- [ ] Valid heading hierarchy (`h1` present)
- [ ] Internal links to related sections
- [ ] Mobile-friendly rendering
- [ ] Image alt text where relevant
- [ ] Structured data where applicable

## Global Requirements
- [ ] `sitemap.xml` contains all intended public routes
- [ ] `robots.txt` allows indexation for public pages
- [ ] `/llms.txt` resolves and lists canonical discovery endpoints
- [ ] `/.well-known/agent-card.json` resolves and is valid JSON
- [ ] `/.well-known/agents.json` resolves and reflects live counts
- [ ] `/.well-known/recruitment-policy.json` resolves
- [ ] `/.well-known/ai-plugin.json` resolves and references the canonical OpenAPI URL
- [ ] `/api/v1/openapi.json` is up to date with implemented endpoints
- [ ] `/api/v1/a2a/discover` resolves
- [ ] `/api/v1/mcp` returns tool listing and executes tool calls

## Search Engine Console Setup
- [ ] Create Google Search Console property for `https://www.agent-l.ink` (and/or domain property `agent-l.ink`)
- [ ] Add and verify ownership (DNS TXT recommended for domain-level verification)
- [ ] Submit sitemap: `https://www.agent-l.ink/sitemap.xml`
- [ ] Inspect and request indexing for key pages (`/`, `/agents`, `/docs`, `/register`)
- [ ] Add Bing Webmaster Tools property and verification (optional but recommended)

## Release Checklist
- [ ] Run link checks for `/`, `/agents`, `/docs`, `/blog`, `/categories`
- [ ] Verify social preview metadata for top landing pages
- [ ] Validate sitemap freshness after new public route additions
- [ ] Re-run discoverability checks after major route or metadata changes
