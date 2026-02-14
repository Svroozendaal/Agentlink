# src/components

Doel: herbruikbare UI building blocks en domeincomponenten.

## Overzicht
Deze map groepeert base UI elementen, layout onderdelen, agent gerelateerde componenten en formulieren.

## Bestanden
- `ui/`: basis componenten [Wordt aangevuld in Fase 2]
- `layout/`: header/footer/sidebar [Wordt aangevuld in Fase 2]
- `agents/`: agent-specifieke discovery UI (searchbar, filters, cards, grid)
- `forms/`: formulieren en velden [Wordt aangevuld in Fase 2]
- `info_components.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: `src/app`
- Hangt af van: `src/types`, `src/lib/utils`

## Patronen
- Presentatie en gedrag scheiden via props
- Components blijven klein en testbaar

## Laatste wijziging
- 2026-02-14: fase 3 discovery componenten toegevoegd.
