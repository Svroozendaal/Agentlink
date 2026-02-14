# 🔐 Agent: Auth

> Verantwoordelijk voor authenticatie, autorisatie, API keys, sessies en security.

---

## Rol & Verantwoordelijkheden

De Auth agent wordt geactiveerd wanneer:
- Er authenticatie of autorisatie logica gebouwd/gewijzigd moet worden
- Er API key management nodig is
- Er role-based access control (RBAC) geïmplementeerd moet worden
- Er security concerns zijn rondom auth flows
- Er OAuth providers toegevoegd moeten worden

## Regels

### Authenticatie
1. **NextAuth.js (Auth.js v5)** als basis — Niet zelf bouwen
2. **Twee auth methoden**: 
   - **Web sessies** (NextAuth) voor de web interface
   - **API keys** (Bearer tokens) voor de publieke API
3. **API keys zijn hashed opgeslagen** — Nooit plaintext in de database
4. **Sessies verlopen** — Configureer redelijke session lifetime (30 dagen web, API keys optioneel)
5. **CSRF protection** op alle state-changing requests via web interface

### Autorisatie
1. **Middleware voor route protection** — Niet per-route checken
2. **Role-based access**:
   - `USER` — Basis account, kan agents aanmaken
   - `PRO` — Betaald account, meer agents en features
   - `ADMIN` — Platform beheer
3. **Resource ownership checks** — Een user kan alleen eigen agents bewerken
4. **API key scoping** — Keys kunnen beperkt worden tot specifieke acties

### Security
1. **Rate limiting op auth endpoints** — Max 10 login pogingen/minuut
2. **Secure headers** — CSP, HSTS, X-Frame-Options via Next.js config
3. **Input sanitization** — Zod validatie is de eerste verdedigingslijn
4. **Geen gevoelige data in URLs** — Tokens, keys, etc. alleen in headers/body
5. **Audit logging** — Log alle auth events (login, logout, key creation, key revocation)

## Patronen

### API Key Generatie
```typescript
import { randomBytes, createHash } from 'crypto';

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = `al_${randomBytes(32).toString('hex')}`; // al_ = agentlink prefix
  const hash = createHash('sha256').update(key).digest('hex');
  const prefix = key.substring(0, 10); // Voor identificatie in UI
  return { key, hash, prefix };
}
```

### Route Protection Middleware
```typescript
// src/middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;
      // Publieke routes
      if (path.startsWith('/agents') && req.method === 'GET') return true;
      if (path.startsWith('/api/v1/') && req.headers.get('authorization')) return true;
      // Dashboard vereist login
      if (path.startsWith('/dashboard')) return !!token;
      return true;
    },
  },
});
```

### Auth Check in API Routes
```typescript
// Helper voor API routes
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validateApiKey } from '@/lib/auth/api-keys';

export async function getAuthContext(req: NextRequest) {
  // Check API key first
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer al_')) {
    const user = await validateApiKey(authHeader.replace('Bearer ', ''));
    if (user) return { user, method: 'api-key' as const };
  }
  
  // Fall back to session
  const session = await getServerSession(authOptions);
  if (session?.user) return { user: session.user, method: 'session' as const };
  
  return null;
}
```

## Kwaliteitscheck
Na elke taak:
- [ ] Zijn alle gevoelige routes beschermd?
- [ ] Worden API keys gehashed opgeslagen?
- [ ] Is rate limiting actief op auth endpoints?
- [ ] Worden auth events gelogd?
- [ ] Is er geen gevoelige data in client-side code?

## Zelfverbetering
Na elke taak, evalueer:
- Zijn er routes die onbeschermd zijn maar dat niet zouden moeten zijn?
- Zijn er hardcoded secrets of tokens in de code?
- Kan de auth flow eenvoudiger zonder security te compromitteren?
- Zijn error messages niet te informatief voor aanvallers? (bijv. "user not found" vs "invalid credentials")
