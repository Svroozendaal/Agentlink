# src/lib/utils

Doel: gedeelde helperfuncties.

## Overzicht
Deze map bevat framework-neutrale helpers voor dataformattering en kleine utility logica.

## Bestanden
- `slugify.ts`: slug normalisatie + uniciteitshelper
- `info_utils.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: meerdere modules in `src/`
- Hangt af van: TypeScript standaardlib

## Patronen
- Utilities blijven side-effect vrij waar mogelijk
- Deterministische output voor voorspelbare tests

## Laatste wijziging
- 2026-02-14: slug helper toegevoegd voor agentroutes.
