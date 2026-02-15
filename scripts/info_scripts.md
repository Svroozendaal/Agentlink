# Scripts

Purpose: operational and setup scripts for local development and Phase 1 growth workflows.

## Available scripts

- `setup.sh`: quick local bootstrap (`pnpm install`, prisma generate, dev server).
- `import-huggingface.ts`: discovers and imports Hugging Face spaces.
- `import-github.ts`: discovers and imports GitHub repositories.
- `import-csv.ts`: imports curated entries from CSV files.
- `outreach-claiming.ts`: generates or sends claiming outreach for unclaimed imports.
- `phase1-start.ts`: orchestrates import + outreach startup flow with report output.

## Report locations

- Imports: `agentlink-output/development/reports/imports`
- Outreach: `agentlink-output/development/reports/outreach`
- Phase 1 run summary: `agentlink-output/development/reports/phase1`

## Notes

- Most scripts support `--dryRun=true` for safe previews.
- Scripts are intended to be idempotent where possible (duplicates are skipped).
