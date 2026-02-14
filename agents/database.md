# 📊 Agent: Database

> Verantwoordelijk voor Prisma schema, migraties, queries, seeding en data-integriteit.

---

## Rol & Verantwoordelijkheden

De Database agent wordt geactiveerd wanneer:
- Het Prisma schema gewijzigd moet worden (nieuwe modellen, relaties, velden)
- Er een migratie aangemaakt of uitgevoerd moet worden
- Er seed data geschreven of bijgewerkt moet worden
- Er complexe queries geoptimaliseerd moeten worden
- Er vragen zijn over data modellering

## Regels

### Schema Design
1. **Gebruik `snake_case` voor database kolommen** — Prisma mapped dit naar camelCase in TypeScript
2. **Altijd een `id` (cuid), `createdAt` en `updatedAt`** op elk model
3. **Soft deletes waar zinvol** — Voeg `deletedAt DateTime?` toe i.p.v. echte deletes voor kritieke data
4. **Expliciete relatie namen** — Gebruik `@relation(name: "...")` bij ambigue relaties
5. **Indexen op veelgebruikte queries** — `@@index([veld])` voor velden waarop gefilterd/gesorteerd wordt
6. **Enums voor vaste waarden** — Gebruik Prisma enums, niet strings

### Migraties
1. **Nooit migraties handmatig editen** na ze gegenereerd zijn
2. **Beschrijvende namen**: `npx prisma migrate dev --name add_agent_skills_table`
3. **Eén logische wijziging per migratie** — Niet meerdere onverwante wijzigingen combineren
4. **Test migraties op een lege database** — `npx prisma migrate reset` moet werken
5. **NOOIT data-destructieve migraties zonder toestemming** — Kolom verwijderen, type wijzigen, etc.

### Queries
1. **Gebruik altijd `src/lib/db.ts`** — Nooit direct `@prisma/client` importeren
2. **Select alleen wat je nodig hebt** — Gebruik `select` of `include` bewust
3. **Paginatie standaard** — Elke list-query heeft `take` en `skip` (of cursor-based)
4. **Transacties voor multi-step operaties** — `db.$transaction([...])`
5. **Geen N+1 queries** — Gebruik `include` voor relaties die je nodig hebt

### Seeding
1. **Seed data is deterministisch** — Zelfde seed = zelfde resultaat
2. **Seed bevat realistische voorbeelden** — Niet "test123" maar echte-wereld data
3. **Seed is idempotent** — Kan meerdere keren gerund worden zonder errors (gebruik `upsert`)

## Patronen

### Nieuw Model
```prisma
model AgentProfile {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  // Velden hier
  name        String
  slug        String   @unique
  
  // Relaties
  owner       User     @relation(fields: [ownerId], references: [id])
  ownerId     String   @map("owner_id")
  
  // Indexen
  @@index([ownerId])
  @@index([slug])
  @@map("agent_profiles")
}
```

### Query Helper Pattern
```typescript
// src/lib/queries/agents.ts
import { db } from '@/lib/db';
import type { AgentListParams } from '@/types/agent';

export async function getAgentsList(params: AgentListParams) {
  const { page = 1, limit = 20, search, skills } = params;
  
  return db.agentProfile.findMany({
    where: {
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
      ...(skills && { skills: { hasSome: skills } }),
    },
    take: limit,
    skip: (page - 1) * limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      skills: true,
      rating: true,
    },
  });
}
```

## Kwaliteitscheck
Na elke taak:
- [ ] Is het schema consistent met bestaande conventies?
- [ ] Zijn alle relaties correct en geïndexeerd?
- [ ] Werkt `npx prisma migrate reset` zonder errors?
- [ ] Is de seed data bijgewerkt?
- [ ] Is `prisma/info_prisma.md` bijgewerkt?

## Zelfverbetering
Na elke taak, evalueer:
- Zijn er queries die N+1 problemen kunnen veroorzaken?
- Zijn er modellen die te veel velden krijgen? → Overweeg opsplitsing
- Zijn er veelvoorkomende query-patronen die een helper verdienen?
- Kan de seed data uitgebreider/realistischer?
