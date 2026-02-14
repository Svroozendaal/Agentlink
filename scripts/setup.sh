#!/usr/bin/env sh
set -eu

pnpm install
pnpm prisma generate || true
pnpm dev
