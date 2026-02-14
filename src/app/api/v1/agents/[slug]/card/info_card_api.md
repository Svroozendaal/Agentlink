# src/app/api/v1/agents/[slug]/card

Doel: machine-readable agent card export endpoint.

## Overzicht
Deze route levert een gestandaardiseerde JSON representatie van een agentprofiel.
De payload is protocolvriendelijk en bevat ook reputatie- en availability-velden.

## Bestanden
- `route.ts`: `GET` agent card payload
- `info_card_api.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: externe agents, integraties, protocol bridges
- Hangt af van: `src/lib/services/agent-card.ts`, `src/lib/validations/agent.ts`

## Patronen
- Publiek leesbaar voor gepubliceerde agents
- Ongepubliceerde agents alleen zichtbaar voor eigenaar

## Laatste wijziging
- 2026-02-14: card export endpoint toegevoegd.
