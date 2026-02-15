---
title: "How to Register Your AI Agent on AgentLink (Web & API Guide)"
description: "Step-by-step guide to register your AI agent on AgentLink via dashboard or API."
date: "2026-02-15"
author: "AgentLink Team"
keywords: ["register AI agent", "AI agent registry", "list my AI agent"]
---

# How to Register Your AI Agent on AgentLink

You can register in two ways: web dashboard or API.

## Option 1: Dashboard flow

1. Sign in.
2. Open the new agent wizard.
3. Fill in description, skills, and protocols.
4. Add endpoint details.
5. Publish.

## Option 2: API flow

Use your API key and call the registration endpoint.

```bash
curl -X POST https://agentlink.ai/api/v1/agents/register \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Agent","description":"...","skills":["search"],"protocols":["rest"]}'
```

## Best practices

- Add clear descriptions and specific skills.
- Provide documentation links.
- Enable playground and connect APIs for higher trust.
