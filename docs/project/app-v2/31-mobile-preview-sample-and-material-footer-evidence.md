# WAFL v2 Mobile Preview Sample and Material Footer Evidence

Status: `LEVEL_4_PRODUCT_VERIFIED`

## Scope and boundary

- Version: `2.0.0-alpha.34`.
- The Expo production-card surface remains a disconnected mock. Its Preview target is explicitly `dev-realistic-sample`.
- The actual issued-document target remains `/workspace/documents/:documentNumber/preview`, uses the issued document number, and never falls back to sample data.
- The sample target is `/dev/workorder-preview-sample`. It is rejected in production and accepts only localhost loopback hosts in development.
- Native opens the configured approved web base. No raw token, company ID, storage key, DB URL, secret, or session claim is placed in a Preview URL.

## Mobile user-path evidence

Local services reused the existing Next server at `http://localhost:3000` and Expo Web server at `http://localhost:8081`; no duplicate server was started.

| Path | Result |
|---|---|
| Top `작지 보기` | Opened `/dev/workorder-preview-sample` |
| `출력·공유 보기` then document `보기` | Opened `/dev/workorder-preview-sample` |
| Sample document | `리넨 라운드 셔츠 원피스`, `작업지시서`, `0차`, `144장`, IVORY/NAVY/BLACK, size matrix, and front/back sketch present |
| Forbidden stale content | `A25CMD`, old alpha.25 Command product, and synthetic wording absent |
| Console | warning/error 0 |

The sample sketch has an explicit accessible label for the front/back product board. The actual renderer keeps its normal product-sketch label unless a development sample supplies the optional label.

## Material footer layout evidence

The card order is `header -> basic information -> usage area/memo -> order summary -> final footer`. The final footer contains reference/warning messages on the left and available actions on the right. It has one top separator and is not rendered when both messages and actions are absent.

| Viewport | Surface | Footer width | Largest action group | Horizontal overflow | Action wrapping |
|---|---|---:|---:|---:|---|
| 390x844 | fabric | 324px | 186px | 0 | `nowrap` |
| 390x844 | accessory | 324px | 186px | 0 | `nowrap` |
| 768x1024 | accessory | 702px | 186px | 0 | `nowrap` |
| 1024x768 | accessory | 652px | 186px | 0 | `nowrap` |

All measured footer separators were `1px`. Editing, requested, and completed rows retained stable widths; completed rows with no actions used the full message area without an empty action placeholder.

## Print evidence

Chromium printed `/dev/workorder-preview-sample` to a local-only QA artifact with three pages: one landscape cover and two portrait continuation pages. Rendered PNG inspection confirmed the front/back sketch, Korean text, material/accessory tables, exact 144 color-size total, size specifications, processes, page headers, and page numbering without clipping, overlap, broken tables, black boxes, or unreadable glyphs.

This artifact is not a `generated_documents` row and does not call PDF Worker, QR, R2, or production storage.

## Automated verification contract

- `tests/workorder-v2-alpha34-mobile-preview-footer-contract.mjs` verifies version mirrors, explicit Preview targets, actual no-fallback behavior, localhost/production boundaries, shared mobile Preview callbacks, footer order/style, alpha.32 inline-edit regression, and forbidden mutation strings.
- Alpha.32 and alpha.33 contracts remain active.
- The pipeline verification profile includes the alpha.34 contract.

## Mutation statement

- DB migration: false.
- DB/schema/business data mutation: false.
- API command or upload/share/order mutation: false.
- R2/Worker/PDF/production mutation: false.
- Root package/lockfile/dependency change: false.

## Next action

Alpha.35 may implement the actual immutable PDF/generated-document/R2 lifecycle only under a separate work order and explicit mutation/storage approval. Do not treat the alpha.34 browser print artifact as lifecycle implementation.
