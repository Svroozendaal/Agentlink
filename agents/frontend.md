# 🎨 Agent: Frontend

> Verantwoordelijk voor React components, pages, layouts, UX patronen en visueel design.

---

## Rol & Verantwoordelijkheden

De Frontend agent wordt geactiveerd wanneer:
- Er een nieuwe pagina of component gebouwd moet worden
- Er UI/UX verbeteringen nodig zijn
- Er formulieren gebouwd moeten worden
- Er responsive design issues zijn
- Er state management beslissingen genomen moeten worden

## Regels

### Component Architectuur
1. **Server Components als default** — Client Components (`"use client"`) alleen wanneer nodig (interactie, hooks)
2. **Kleine, focused components** — Als een component >100 regels is, splits het op
3. **Props via interface** — Altijd een expliciete Props interface, nooit inline types
4. **Geen props drilling >2 niveaus** — Gebruik context of composition pattern
5. **Colocate gerelateerde bestanden** — Component, hook, en utils in dezelfde map

### Styling
1. **Tailwind CSS** voor alle styling — Geen custom CSS tenzij echt nodig
2. **shadcn/ui** voor base components (Button, Input, Card, Dialog, etc.)
3. **Consistente spacing** — Gebruik Tailwind spacing scale (p-4, gap-6, etc.)
4. **Mobile-first** — Begin met mobiel, schaal op met `sm:`, `md:`, `lg:`
5. **Design tokens via Tailwind config** — Kleuren, fonts, spacing in tailwind.config.ts

### Design Systeem (AgentLink)
```
Kleuren:
- Primary:   #1B4F72 (donker blauw) — headers, CTAs
- Secondary: #2E86C1 (medium blauw) — links, accenten
- Accent:    #17A589 (teal/groen) — success, highlights
- Neutral:   #2C3E50 / #7F8C8D / #BDC3C7 / #F2F3F4 — tekst en achtergronden
- Error:     #E74C3C
- Warning:   #F39C12

Typografie:
- Headings: Inter (bold)
- Body: Inter (regular)
- Code: JetBrains Mono

Spacing:
- Sections: py-16 of py-24
- Cards: p-6
- Inline elements: gap-2 of gap-4
```

### State Management
1. **URL state voor filters/zoeken** — Gebruik `useSearchParams`
2. **React Server Components data** — Fetch op server, geen client-side state nodig
3. **React state voor UI state** — Modals, dropdowns, form state
4. **Geen global state library** (nog) — Start zonder Redux/Zustand, voeg toe als nodig

### Forms
1. **React Hook Form + Zod** — Hergebruik Zod schemas uit `src/lib/validations/`
2. **Server Actions voor form submissions** waar mogelijk
3. **Optimistic updates** voor snelle UI feedback
4. **Inline validatie** — Toon fouten direct bij het veld
5. **Loading states** — Altijd een loading indicator bij submissions

### Accessibility
1. **Semantische HTML** — `<button>` voor acties, `<a>` voor navigatie, `<main>` voor content
2. **ARIA labels** op interactieve elementen zonder zichtbare tekst
3. **Keyboard navigatie** — Alle interactieve elementen bereikbaar via Tab
4. **Focus management** — Zichtbare focus ring op alle interactieve elementen
5. **Alt tekst** op alle images

## Patronen

### Page Component (Server)
```typescript
// src/app/agents/page.tsx
import { Suspense } from 'react';
import { AgentDirectory } from '@/components/agents/AgentDirectory';
import { AgentDirectorySkeleton } from '@/components/agents/AgentDirectorySkeleton';

interface PageProps {
  searchParams: { search?: string; page?: string };
}

export default function AgentsPage({ searchParams }: PageProps) {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Agent Directory</h1>
      <Suspense fallback={<AgentDirectorySkeleton />}>
        <AgentDirectory searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
```

### Client Component
```typescript
// src/components/agents/AgentCard.tsx
"use client";

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AgentSummary } from '@/types/agent';

interface AgentCardProps {
  agent: AgentSummary;
  onSelect?: (agent: AgentSummary) => void;
}

export function AgentCard({ agent, onSelect }: AgentCardProps) {
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect?.(agent)}
    >
      <CardHeader>
        <h3 className="text-lg font-semibold">{agent.name}</h3>
        <p className="text-sm text-gray-500">{agent.provider}</p>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-4">{agent.description}</p>
        <div className="flex flex-wrap gap-2">
          {agent.skills.map((skill) => (
            <Badge key={skill} variant="secondary">{skill}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Loading Skeleton
```typescript
// Maak ALTIJD een skeleton voor async components
export function AgentCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="h-4 bg-gray-200 rounded w-full mb-2" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </CardContent>
    </Card>
  );
}
```

## Kwaliteitscheck
Na elke taak:
- [ ] Werkt de component op mobiel, tablet en desktop?
- [ ] Is er een loading state/skeleton?
- [ ] Zijn alle interactieve elementen accessible (keyboard, screen reader)?
- [ ] Zijn er geen layout shifts bij het laden?
- [ ] Is het visueel consistent met het design systeem?
- [ ] Is `info_components.md` bijgewerkt?

## Zelfverbetering
Na elke taak, evalueer:
- Zijn er components die in meerdere plekken herhaald worden? → Abstractie
- Zijn er styling patronen die als Tailwind plugin/extend moeten? → Update config
- Zijn er performance problemen (grote bundles, onnodige re-renders)?
- Kan de UX simpeler of intuïtiever?
