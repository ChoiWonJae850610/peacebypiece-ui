# WAFL v2 Alpha.35 Mobile Material Compact Input Evidence

Status: `LEVEL_4_PRODUCT_VERIFIED`.

## Delivery identity

- Baseline HEAD: `8958df26edb3c0dcc307812f88c3725054f0c5f8`.
- Baseline version: `2.0.0-alpha.34`.
- Result version: `2.0.0-alpha.35`.
- Result HEAD: recorded by the matching final repo-state artifact.

## Material card contract

- The header shows material name, inline unit, and one canonical status badge. The former helper sentences are removed.
- Core row 1 is `거래처 / 색상·옵션 / 단가`.
- Core row 2 is `필요 / 로스·여유 / 재고`.
- Every label and value shares one 22px line. Editable `입력중` rows use same-position controls without a full border, background box, or radius. Requested/completed rows are plain read-only values.
- Usage area and memo remain one-line fields with `사용 부위를 알려주세요` and `메모를 입력하세요` placeholders.
- Fixture strings are parsed into a local view model. Order quantity is `max(required + allowance - stock, 0)` and amount is order quantity multiplied by unit price.
- The base fabric example is `420 + 42 - 80 = 382` and `382 x 12,800 = 4,889,600`. Changing unit from `yd` to `m` changes only the suffix. Changing required to 430 produces `392m` and `5,017,600원`.
- Missing required values use only a muted label/underline. `row.leftover`, `row.warning`, and their separate footer messages are not rendered.
- The final and only block after usage/memo is `materialOrderActionRow`: order summary on the left and state-allowed `nowrap` actions on the right. Phone widths may hide visual captions while retaining accessibility labels.

## Preserved contracts

- Status badges remain exactly `입력중`, `발주요청`, and `완료`.
- Enter/blur commits once, Escape restores the start value, unchanged normalized values do not commit, and editing does not resize the compact row.
- Process remains memo-only on the mobile surface.
- The localhost sample route, actual no-fallback Preview, first landscape page, portrait continuation pages, matrix total 144, and production-host 404 guard are unchanged.
- Mobile edits are local state only. No API, DB, R2, Worker, upload, order mutation, generated-document, or production path is added.

## Product evidence

| Owner requirement | Runtime evidence | Result |
|---|---|---|
| Two core rows, three fields each | All fabric/accessory rows reported `22px` rows with `3/3` fields | PASS |
| Same-position edit and stable height | Representative fabric/accessory cards stayed `214px` before, during, and after edit; inputs were `22px`, `12px/17px`, bottom border `1px` | PASS |
| Card density | Alpha.34 representative input card `275px` to alpha.35 `214px`, reduction `61px`; no text/field/action overlap observed | PASS |
| Local calculation | Initial `382yd / 4,889,600원`; unit edit produced `382m` without conversion; required `430` produced `392m / 5,017,600원` | PASS |
| Enter/blur/Escape | Blur saved a color edit, Enter saved unit/required edits, Escape restored the tested fields; static double-completion/unchanged guards PASS | PASS |
| Locked states | Requested unit/price edit controls `0`; completed memo edit controls `0` | PASS |
| Final row and overflow | Footer/action overflow `0` at 390, 768, and 1024; root horizontal overflow `0`; action captions collapse to icon-only only below phone breakpoint | PASS |
| Preview frozen | Mobile `작지 보기` opened the localhost sample; title/product/0차/144장/three colors/sketch PASS; production-host response `404` | PASS |
| Print regression | Three nonblank pages; page 1 `841.92 x 594.96pt`, pages 2-3 `594.96 x 841.92pt`; extracted text lengths `552/754/699`; visual clipping/overlap/broken table `0` | PASS |
| Console/network | In-app console warning/error `0`; Chromium print run failed requests `0` | PASS |

Evidence files, excluded from Git and delivery ZIP:

- `artifacts/alpha35/mobile-fabric-before.png`
- `artifacts/alpha35/mobile-fabric-edit.png`
- `artifacts/alpha35/mobile-accessory-before.png`
- `artifacts/alpha35/mobile-accessory-edit.png`
- `artifacts/alpha35/tablet-portrait-accessory.png`
- `artifacts/alpha35/tablet-landscape-accessory.png`
- `artifacts/alpha35/mobile-sample-preview.png`
- `artifacts/alpha35/sample-issued-workorder-print.pdf`
- `artifacts/alpha35/sample-print-page-1.png` through `sample-print-page-3.png`

## PowerShell and roadmap decision

No new PowerShell menu or 2.0-specific roadmap TypeScript file is added. The existing `automation-infrastructure` profile is the canonical verification entry, and `lib/internal/roadmap` currently contains only the preserved 0.24.x roadmap series. Alpha.35 is recorded in this App-first roadmap instead of inventing a parallel TypeScript source.

## Mutation statement and next gate

- DB migration/schema/data mutation: false.
- API/business-data mutation: false.
- R2/Worker/PDF/generated-document/production mutation: false.
- Root package/lockfile/dependency change: false.
- Alpha.36 may address actual immutable PDF/generated-document/R2 lifecycle only under a separate work order and explicit approval.
