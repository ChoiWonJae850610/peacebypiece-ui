# 0.24.23 Source Architecture Cleanup Audit

Version: 0.24.23
Status: implementation result and follow-up inventory
Scope: oversized source files, duplicate repository/service boundaries, dead/mock/fallback candidates, PDF Worker boundary, TypeScript/API/DB contract risks, and logging/redaction baseline

## Result Summary

0.24.23 reduced one high-risk large editor module without changing product behavior, permissions, tenant checks, DB schema, R2 behavior, package metadata, or PDF policy.

- `components/workorder/drawing/WorkOrderDrawingCanvasEditor.tsx`: 52,725 bytes before cleanup, 40,366 bytes after cleanup.
- `components/workorder/drawing/workOrderDrawingCanvasPrimitives.tsx`: new 15,425 byte primitive/helper module.
- No new source file is above 50KB.
- Production DB/R2 mutation: none.
- DB schema migration/backfill/RLS DDL: none.
- Package/lockfile change: none.

## Oversized File Measurement

The current priority list after measurement is:

| Area | File | Size observed | Classification | 0.24.23 action |
| --- | --- | ---: | --- | --- |
| WAFL UI catalog | `app/ui/WaflUiCatalogPage.tsx` | 114,035 bytes | static catalog data plus sample renderers | measured; next split should move catalog content and sample sections by responsibility |
| Admin i18n Korean | `lib/i18n/ko/admin.ts` | 95,119 bytes | large translation bundle | measured; split by admin domain after i18n contract is added |
| Admin i18n English | `lib/i18n/en/admin.ts` | 89,838 bytes | large translation bundle | measured; split in parallel with Korean bundle |
| Admin settings | `components/admin/settings/AdminSettingsHub.tsx` | 67,726 bytes | multiple panels, modal markdown renderer, data loading | measured; next low-risk split is document/feedback/account panels |
| Join requests | `lib/invitations/joinRequestRepository.ts` | 61,044 bytes | DB/in-memory compatibility, company approval, member approval | measured; do not split until route-handler contract covers approval semantics |
| Drawing editor | `components/workorder/drawing/WorkOrderDrawingCanvasEditor.tsx` | 52,725 bytes | canvas primitives plus modal state | split primitives into `workOrderDrawingCanvasPrimitives.tsx` |

`cloudflare/pdf-generator-worker/node_modules/**` is physically large but is not a product source module. It remains outside this cleanup decision unless a separate dependency/package-manager cleanup is approved.

## Duplicate Repository and Service Boundaries

The repository still has intentional compatibility layers in the workorder area:

- `lib/repositories/workorderRepository.ts`
- `lib/repositories/dbWorkorderRepository.ts`
- `lib/workorder/repository/workOrderRepository.ts`
- `lib/workorder/repository/dbWorkOrderRepository.ts`
- `lib/workorder/service/workOrderService.ts`

This is not safe to collapse in 0.24.23 because workorder route handlers, hooks, DB row mappers, and compatibility adapters still share the boundary. The next cleanup should first add source contracts around route response shape and tenant-scoped repository selection.

## Dead Route, Component, and Helper Candidates

No dead route or component was removed in this version. The highest-risk candidates require stronger reference evidence before deletion:

- deprecated Cloudflare PDF single-file entrypoint;
- legacy workorder repository facades;
- admin settings sub-panels still co-located in `AdminSettingsHub`;
- large UI catalog samples embedded in `WaflUiCatalogPage`.

Deletion remains blocked unless `rg`, route imports, tests, and deployment notes all agree that the path is unused.

## Production Mock/Demo/Fallback Scan

This section is the 0.24.23 production mock/demo/fallback boundary record.

The broad `mock`, `demo`, `fallback`, and `legacy` scan still contains test fixtures, E2E mocks, simulator data, and documented compatibility paths. No new production fallback was added in 0.24.23.

Important production-facing distinction:

- `lib/generated-documents/pdfGeneratorClient.ts` returns `not_configured` when the external generator URL is missing.
- It does not silently switch to the deprecated Cloudflare single-file Worker.
- `scripts/functions-pdf-mock.mjs` is a contract/mock script and is not a runtime PDF renderer.

## Legacy PDF Worker Boundary

This section is the 0.24.23 legacy PDF Worker boundary record.

Canonical PDF Worker path:

- `cloudflare/pdf-generator-worker/`
- `cloudflare/pdf-generator-worker/src/index.js`
- `cloudflare/pdf-generator-worker/wrangler.toml`

Deprecated path:

- `cloudflare/pdf-generator-worker.js`
- `cloudflare/pdf-generator-worker.wrangler.example.toml`

0.24.23 keeps the deprecated files because deployment verification has not proven that deletion is safe. The app source under `app/**`, `components/**`, and `lib/**` must not depend on `cloudflare/pdf-generator-worker.js`.

## TypeScript, API, and DB Contract Risks

The current cleanup risk concentrates in:

- `lib/invitations/joinRequestRepository.ts`: combines DB writes, in-memory compatibility, role-template permission assignment, company approval, member approval, and standards initialization.
- `lib/workorder/api/workOrderRouteHandlers.ts`: large route-handler contract surface.
- workorder repository facades: duplicated names reflect compatibility layers and should not be collapsed without tests.

No TypeScript row type, API payload, DB column, or permission behavior was changed in 0.24.23.

## Central Logger and Sensitive Logging

This section is the 0.24.23 central logger and sensitive logging boundary record.

Current baseline:

- `lib/debug/trace.ts` is disabled in production through `NODE_ENV !== "production"`.
- trace payload keys matching token, secret, password, authorization, cookie, URL, or key are redacted.
- broader structured logging, correlation IDs, allowed metadata, retention class, and operator alerts remain TODO from document 26.

0.24.23 does not introduce a new logger API. The next logger cleanup should add a contract before replacing direct `console.*` usage.

## Follow-Up Order

Recommended next source cleanup units:

1. Split `WaflUiCatalogPage` static catalog content from sample renderers.
2. Split `AdminSettingsHub` document/feedback/account panels into files below 50KB.
3. Add join-request approval route contracts before splitting `joinRequestRepository`.
4. Add i18n bundle shape contracts before splitting `lib/i18n/*/admin.ts`.
5. Decide deprecated PDF Worker deletion only after deployment verification.
