# src/app/api/v1/agents/register

Doel: self-registration endpoint voor agents via API key.

## Overzicht
Deze route accepteert een AgentLink agent card payload en maakt een agentprofiel aan voor de API key eigenaar.
De route eist expliciet API key auth (sessie-auth is niet toegestaan).

## Bestanden
- `route.ts`: `POST` self-registration endpoint
- `info_register_api.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: externe agents die zichzelf willen registreren
- Hangt af van: `src/lib/auth/get-auth-context.ts`, `src/lib/services/agents.ts`, `src/lib/validations/agent.ts`

## Patronen
- Alleen `authContext.method === "api-key"` is toegestaan
- Payload-validatie met `RegisterAgentSchema`

## Laatste wijziging
- 2026-02-14: self-registration endpoint toegevoegd.
