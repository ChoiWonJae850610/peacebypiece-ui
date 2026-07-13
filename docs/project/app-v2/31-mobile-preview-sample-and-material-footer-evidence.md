# WAFL v2 Mobile Preview Sample and Material Footer Evidence

Status: `LEVEL_4_PRODUCT_VERIFIED`

## Delivery identity and alpha.33 gap

- Baseline HEAD: `e1620563d9745f6b0af4ee9a6927242d18ab8c23` (`2.0.0-alpha.33`).
- Alpha.34 implementation HEAD: `1dd3c1691d54e02463191a64d1a902f3380323dd`.
- Alpha.33 verified the sample route and `/ui` entry directly, but the Expo mock still built an actual issued-document URL from `WAFN-26FWA-A25CMD-260711-001-R0`. The missing evidence was the user click path from the app button to the sample.
- The old result therefore showed alpha.25 synthetic Command content and no realistic product board. Alpha.34 removes that document identity from the mock opener without changing the actual issued Preview resolver or tenant data.

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

- Click start URL: `http://localhost:8081/`.
- Final opened URL: `http://localhost:3000/dev/workorder-preview-sample`.
- Mobile sample screenshot: `artifacts/alpha34/mobile-sample-preview.png`.
- Fabric footer screenshot: `artifacts/alpha34/mobile-fabric-footer.png`.
- Accessory footer screenshot: `artifacts/alpha34/mobile-accessory-footer.png`.
- Tablet portrait screenshot: `artifacts/alpha34/tablet-portrait-accessory-footer.png`.
- Tablet landscape screenshot: `artifacts/alpha34/tablet-landscape-accessory-footer.png`.

The screenshot and PDF files are local QA artifacts and are excluded from Git, source ZIP, and `4. Newest`.

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

The footer is the final MaterialRow child. Content elements after the action cluster: 0. Action wrap line count at 390px: 1. Independent action-only footer rows: 0. Alpha.32's 22px inline row, 12px/17px value typography, `multiline=false`, double-completion guard, locked affordance, and process work-memo-only contract all passed regression tests.

## Print evidence

Chromium printed `/dev/workorder-preview-sample` to a local-only QA artifact with three pages: one landscape cover and two portrait continuation pages. Rendered PNG inspection confirmed the front/back sketch, Korean text, material/accessory tables, exact 144 color-size total, size specifications, processes, page headers, and page numbering without clipping, overlap, broken tables, black boxes, or unreadable glyphs.

This artifact is not a `generated_documents` row and does not call PDF Worker, QR, R2, or production storage.

Local print artifact: `artifacts/alpha34/sample-issued-workorder-print.pdf`.

## PowerShell menu decision

No new menu entry was added. The alpha.34 contract is part of the existing `automation-infrastructure` verification profile, which is the narrower reusable path and avoids another duplicate read-only menu command.

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
