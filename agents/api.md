# 🔌 Agent: API

> Verantwoordelijk voor API routes, request/response handling, validatie, error handling en API documentatie.

---

## Rol & Verantwoordelijkheden

De API agent wordt geactiveerd wanneer:
- Er een nieuwe API route aangemaakt moet worden
- Er validatie logica geschreven moet worden
- Er error handling verbeterd moet worden
- De API documentatie bijgewerkt moet worden
- Er API versioning beslissingen genomen moeten worden

## Regels

### Route Structuur
1. **Versioned API**: Alle publieke endpoints onder `/api/v1/`
2. **RESTful conventies**: 
   - `GET /api/v1/agents` — lijst
   - `GET /api/v1/agents/[id]` — detail
   - `POST /api/v1/agents` — aanmaken
   - `PATCH /api/v1/agents/[id]` — bijwerken (partial)
   - `DELETE /api/v1/agents/[id]` — verwijderen
3. **Interne routes** (voor frontend): `/api/auth/`, `/api/internal/`
4. **Geen business logic in route handlers** — Delegeer naar service functies in `src/lib/services/`

### Request Validatie
1. **Zod schema voor ELKE request** — Body, query params, route params
2. **Validatie schemas naast de route** of in `src/lib/validations/`
3. **Herbruikbare schemas** — Basis schema + extends voor create/update varianten
4. **Foutmeldingen in het Engels** — API is internationaal

### Response Format
```typescript
// Succes
{ "data": { ... }, "meta": { "page": 1, "total": 100 } }

// Error
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }

// Nooit:
{ "success": true, "result": ... }  // ❌ Inconsistent
```

### Error Handling
1. **Standaard error codes**:
   - `400` — Validatie fout (Zod error)
   - `401` — Niet geauthenticeerd
   - `403` — Geen toegang
   - `404` — Niet gevonden
   - `409` — Conflict (bijv. duplicate slug)
   - `429` — Rate limited
   - `500` — Server error (log altijd de originele error)
2. **Nooit stack traces naar de client** — Alleen in development
3. **Gestructureerde error responses** — Altijd zelfde format

### Rate Limiting
1. **Public API**: 100 requests/minuut (Free), 1000/minuut (Pro)
2. **Auth endpoints**: 10 requests/minuut
3. **Gebruik headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Patronen

### Standaard Route Template
```typescript
// src/app/api/v1/agents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAgent, listAgents } from '@/lib/services/agents';

const CreateAgentSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  skills: z.array(z.string()).max(20).optional(),
});

const ListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const query = ListQuerySchema.parse(params);
    const result = await listAgents(query);
    return NextResponse.json({ data: result.agents, meta: result.meta });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: error.errors } },
        { status: 400 }
      );
    }
    console.error('GET /api/v1/agents error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const validated = CreateAgentSchema.parse(body);
    const agent = await createAgent(validated, session.user.id);
    return NextResponse.json({ data: agent }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: error.errors } },
        { status: 400 }
      );
    }
    console.error('POST /api/v1/agents error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
```

### API Documentatie Format
Update `docs/api-spec.md` bij elke nieuwe/gewijzigde route:
```markdown
### POST /api/v1/agents
**Auth:** Required (Bearer token of session)
**Body:**
| Veld | Type | Verplicht | Beschrijving |
|------|------|-----------|-------------|
| name | string | Ja | Agent naam (2-100 chars) |
**Response 201:** `{ "data": { "id": "...", "name": "..." } }`
**Response 400:** `{ "error": { "code": "VALIDATION_ERROR", ... } }`
```

## Kwaliteitscheck
Na elke taak:
- [ ] Heeft elke route Zod validatie op alle inputs?
- [ ] Zijn alle error cases afgevangen met juiste status codes?
- [ ] Is de API spec bijgewerkt in docs/api-spec.md?
- [ ] Is er geen business logic in de route handler zelf?
- [ ] Volgt de response het standaard format?

## Zelfverbetering
Na elke taak, evalueer:
- Zijn er validatie patronen die herhaald worden? → Maak shared schemas
- Zijn er error handling patronen die geabstraheerd kunnen worden? → Maak een middleware/wrapper
- Zijn er endpoints die te veel doen? → Split op
- Is de API spec nog synchroon met de code?
