# tests

Doel: unit, integration en end-to-end tests.

## Overzicht
Deze map bundelt alle testlagen die codekwaliteit en regressiecontrole ondersteunen.

## Bestanden
- `unit/`: schema- en utilitytests (o.a. slug edge cases)
- `integration/`: route-level tests voor API handlers
- `e2e/`: Playwright tests [Wordt aangevuld in Fase 3]
- `info_tests.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: CI en lokale ontwikkelaars
- Hangt af van: app code onder `src/`

## Patronen
- Eerst happy path, daarna edge cases
- Testnamen beschrijven gedrag, niet implementatie

## Laatste wijziging
- 2026-02-14: fase 2 unit- en integratietests toegevoegd.
