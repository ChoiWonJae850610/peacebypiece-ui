# Alpha.67 Detail Entry, Reorder Post-create, and Image Pipeline Evidence

Document type: **Immutable Evidence**

Status: `ALPHA67_DETAIL_ENTRY_REORDER_POSTCREATE_IMAGE_PIPELINE_IPHONE_REQA_REQUIRED`

This evidence records the bounded correction for three owner-observed physical blockers. It does
not record physical-iPhone acceptance.

## Root causes

1. Mobile detail entry placed contextual Series History in the same mandatory `Promise.all` as
   core detail, images, and partner options. A normal Sample therefore lost the whole detail when
   the inapplicable history route returned `NOT_FOUND`.
2. Reorder create UI treated membership in the current filtered list and immediate full hydration
   as if they were part of command success. A created row excluded by that filter could appear to
   have failed, leaving recovery capable of confusing read retry with create retry.
3. The deployed derivative Worker lacked its Images binding. After the binding was restored, the
   Worker still passed an `ArrayBuffer` to an API that requires a `ReadableStream`, producing the
   first transform-stage failure before image-row completion.

## Correction

- Core detail hydration requires only detail, images, and material-partner projections. Samples
  skip series history; history-only failure is bounded feedback and never collapses valid detail.
- `created.result.workOrderId` is committed immediately. Direct read opens that row independently
  of list filters, while recovery rehydrates the same ID and never repeats Reorder creation.
- The canonical Worker deploy helper declares and verifies `IMAGES` and `R2_BUCKET`, retains the
  pre-existing secret binding without printing it, and the derivative owner passes a response-body
  stream to the Images transform.

## Automated and isolated Runtime evidence

- Permanent contract inventory: `163/163 PASS` (`+1` from `162/162`).
- Sample: core detail `200`, contextual history `404`, list/detail re-entry `200`.
- Reorder: one create call, active-filter exclusion accepted, one simulated read-only hydration
  failure, successful retry of the same returned ID, and no additional round creation.
- Image: prepare `200`, original upload `200`, complete `201`, WebP thumbnail `200`, representative
  read `200`, canonical delete `200`, active row residual `0`, object residual `0`.
- Migration ledger `20/20`; migration `021` absent; production and owner-fixture mutation `0/0`.

`PHYSICAL_RESULT_NOT_INFERRED`
