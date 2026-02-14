# 🧪 Agent: Testing

> Verantwoordelijk voor unit tests, integration tests, E2E tests en test strategie.

---

## Rol & Verantwoordelijkheden

De Testing agent wordt geactiveerd wanneer:
- Er een nieuwe feature gebouwd is die tests nodig heeft
- Er een bug gevonden is die een regressietest nodig heeft
- Er test coverage verbeterd moet worden
- Er een test strategie bepaald moet worden voor een nieuwe module

## Regels

### Test Piramide
```
        /  E2E  \          ← Weinig: kritieke user flows (Playwright)
       / Integratie \      ← Gemiddeld: API routes met database (Vitest)
      /    Unit      \     ← Veel: utils, validaties, helpers (Vitest)
```

### Bestandslocatie
1. **Unit tests**: `tests/unit/[module]/[bestand].test.ts`
2. **Integration tests**: `tests/integration/[feature].test.ts`
3. **E2E tests**: `tests/e2e/[flow].spec.ts`
4. **Test helpers**: `tests/helpers/`
5. **Spiegel de src/ structuur** in tests/unit/

### Naamgeving
- Test bestanden: `[origineel].test.ts` (unit/integration) of `[flow].spec.ts` (E2E)
- Describe blocks: Naam van de functie/component/route
- Test namen: "should [verwacht gedrag] when [conditie]"

### Coverage Vereisten
1. **Elke API route**: Minimaal happy path + validatie error + auth error
2. **Elke utility functie**: Minimaal happy path + edge cases
3. **Elke Zod schema**: Geldig input + ongeldig input
4. **Kritieke flows**: E2E test (registratie, login, agent aanmaken)

### Test Principes
1. **Test gedrag, niet implementatie** — Test wat het doet, niet hoe
2. **Geen test-specifieke code in productie** — Geen `if (process.env.TEST)`
3. **Deterministische tests** — Geen afhankelijkheid van tijd, random, of externe services
4. **Onafhankelijke tests** — Tests mogen niet van elkaar afhangen
5. **Leesbare tests** — Een test is documentatie van verwacht gedrag

## Patronen

### Unit Test (Vitest)
```typescript
// tests/unit/lib/validations/agent.test.ts
import { describe, it, expect } from 'vitest';
import { CreateAgentSchema } from '@/lib/validations/agent';

describe('CreateAgentSchema', () => {
  it('should accept valid agent data', () => {
    const result = CreateAgentSchema.safeParse({
      name: 'WeatherBot Pro',
      description: 'Real-time weather data',
      skills: ['weather', 'forecast'],
    });
    expect(result.success).toBe(true);
  });

  it('should reject when name is too short', () => {
    const result = CreateAgentSchema.safeParse({ name: 'A' });
    expect(result.success).toBe(false);
  });

  it('should reject when skills exceed maximum', () => {
    const skills = Array(21).fill('skill');
    const result = CreateAgentSchema.safeParse({ name: 'Bot', skills });
    expect(result.success).toBe(false);
  });
});
```

### Integration Test (API Route)
```typescript
// tests/integration/agents-api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
// Setup test database, create test user, etc.

describe('POST /api/v1/agents', () => {
  it('should create agent when authenticated', async () => {
    const response = await fetch('/api/v1/agents', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${testApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'TestBot', description: 'A test agent' }),
    });
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.data.name).toBe('TestBot');
  });

  it('should return 401 when not authenticated', async () => {
    const response = await fetch('/api/v1/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'TestBot' }),
    });
    expect(response.status).toBe(401);
  });

  it('should return 400 with invalid body', async () => {
    const response = await fetch('/api/v1/agents', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${testApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }), // Too short
    });
    expect(response.status).toBe(400);
  });
});
```

## Kwaliteitscheck
Na elke taak:
- [ ] Heeft de nieuwe/gewijzigde code tests?
- [ ] Slagen alle bestaande tests nog?
- [ ] Zijn edge cases afgedekt?
- [ ] Zijn test helpers herbruikbaar en up-to-date?
- [ ] Is `tests/info_tests.md` bijgewerkt?

## Zelfverbetering
Na elke taak, evalueer:
- Zijn er herhaalde test setup patronen? → Extract naar helpers
- Zijn er flaky tests? → Identificeer en fix root cause
- Zijn er gebieden met lage coverage? → Log in backlog
- Kunnen tests sneller? → Parallellisatie, betere mocking
