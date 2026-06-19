# PeaceByPiece / WAFL Codex handoff — 0.23.99

## Baseline
- Branch: master
- Runtime: Next.js + PostgreSQL + Cloudflare R2
- Patch baseline: 0.23.99

## Mandatory rules
- Work from the latest repository state; never edit production DB/R2 for tests.
- Test fixtures use `wafl-fn` only. Cleanup must be prefix-scoped and confirmed.
- Preserve tenant isolation and server-side permission checks.
- `member_permissions` is the effective permission source; role names are presentation/default bundles only.
- Run `npm run build`, `npm run test:smoke:db-api`, `npm run test:permissions`, and relevant Playwright tests before handoff.
- Do not commit `.env.local`, credentials, DB URLs, R2 secrets, or generated customer files.
- Use WAFL common components and theme tokens before screen-local CSS.

## Current checkpoint
- Automatic baseline tests passed through 0.23.94.
- Simulator A–J and dev/test context switching are implemented.
- 0.23.99 expands master categories, realistic non-uniform statistics, and member permission scenarios.
- PDF finalization, production readiness, legal/company identity values, and broader manual responsive validation remain.
