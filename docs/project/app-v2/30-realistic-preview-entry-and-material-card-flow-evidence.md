# WAFL v2 Realistic Preview Entry and Material Card Flow Evidence

Version: `2.0.0-alpha.33`

## Baseline and decision

- Baseline HEAD: `31125eb0ff40a51cb56f4b43b0c0af03a20ef350`.
- Result HEAD: the final alpha.33 commit recorded in the matching repo-state artifact.
- User QA showed that an old synthetic actual Preview could be mistaken for the intended document sample.
- Actual Preview therefore remains an honest view of its immutable issued revision, including empty states and old synthetic values. It never receives a realistic-sample fallback.
- The deterministic realistic sample remains a separate localhost-only design and print evaluation route.

## Entry and production boundary

- Sample route: `/dev/workorder-preview-sample` guarded by `assertLocalOnlyRouteHost()`.
- Internal entry: `/ui` shows the secondary action `실무 샘플 보기` and opens the sample in a separate tab.
- `/ui` and the sample route both return not-found on non-local hosts; no production customer entry is added.
- The actual loaders import no sample fixture or repository sample asset.
- Known stable product category codes use a display-only Korean label mapping. Unknown codes remain unchanged, and persisted product names/memos are never rewritten.

## Realistic sample contract

- Product: `리넨 라운드 셔츠 원피스`, document `WAFN-26FW-O-LNDRS-260713-001-R0`, due 2026-08-15, quantity 144, factory `성수 어패럴`, manager `김생산`.
- Repository-owned SVG visibly separates 앞면 and 뒷면 and includes IVORY/NAVY/BLACK chips without external URLs or internal test labels.
- Matrix rows are IVORY 32, NAVY 48, BLACK 64; columns are S 36, M 72, L 36; expected and actual total are 144.
- Factory data contains two fabrics, four accessories, five size measurements, four processes, and six practical Korean delivery instructions.
- The Preview process table remains exactly six columns; legacy process application fields are merged into work memo for display only.

## Mobile material card contract

Fabric and accessory rows share this sequence:

1. header and status
2. basic supplier/color/quantity/unit information
3. usage area and memo
4. order quantity/unit price/amount summary
5. reference and blocking-warning text
6. final footer actions

- Nothing follows the action footer. Completed rows keep no actions.
- The footer uses existing icons, state rules, and compact button sizes; no absolute mid-card placement is introduced.
- Inline fields retain the shared 22px single-line row, 12px/17px/800 value typography, fixed card height during edit, and Escape/Enter/blur completion guards.

## Verification evidence

Status: `LEVEL_4_PRODUCT_VERIFIED` on the alpha.33 working tree before final Finish.

### Browser and responsive evidence

- `/ui` rendered the single secondary entry `실무 샘플 보기` with `href=/dev/workorder-preview-sample`. Both `/ui` and the sample route returned 404 with `Host: www.wafl.co.kr`.
- The localhost sample rendered three document sections with horizontal overflow 0. The product board was 572 x 661 CSS pixels and visibly contained front/back diagrams and IVORY/NAVY/BLACK swatches. The 144 matrix and the six process headers were present in the DOM.
- The actual issued document `WAFN-26FWA-A25CMD-260711-001-R0` was checked in the approved Company A simulator read context under the existing development runtime guard. It retained its actual old synthetic product name, memo, material rows, empty image state, and absent size/color sections. It contained no realistic sample product, factory, or sample image fallback. The known `apparel.top` code displayed as `상의` without rewriting stored data.
- The temporary browser impersonation changed session context only, performed no business-data write, and was restored to the original system-admin session after QA.
- Mobile 390px, tablet portrait 768px, and tablet landscape 1024px all had horizontal overflow 0. Fabric and accessory cards rendered the required order, and each mutable card ended with its action footer.
- The inline usage-area control rendered as an HTML single-line input at 22px height with 12px font, 17px line height, and weight 800. The first fabric card remained 312px before, during, and after Escape cancellation.
- Browser console warning/error count was 0 across `/ui`, sample, actual Preview, and Expo mobile/tablet runs. The Chromium sample run recorded failed requests 0 and error responses 0.

Key screenshots:

- `artifacts/alpha33/ui-sample-entry.png`
- `artifacts/alpha33/actual-issued-preview.png`
- `artifacts/alpha33/sample-page-1-landscape.png`
- `artifacts/alpha33/sample-page-2-material-matrix.png`
- `artifacts/alpha33/sample-page-3-size-process.png`
- `artifacts/alpha33/mobile-fabric-cards.png`
- `artifacts/alpha33/mobile-accessory-cards.png`
- `artifacts/alpha33/tablet-portrait-fabric-cards.png`
- `artifacts/alpha33/tablet-landscape-fabric-cards.png`

### Chromium PDF evidence

- Local QA PDF: `reports/alpha33/wafl-alpha33-realistic-preview-sample.pdf`.
- Size: 140,333 bytes; pages: 3.
- Page 1: 841.92 x 594.96 pt, landscape. Pages 2 and 3: 594.96 x 841.92 pt, portrait.
- Every page had extracted content; blank pages 0, edge violations 0, row-split candidates 0.
- Product name, front/back labels, IVORY/NAVY/BLACK, total 144, and all six process headers were present in the PDF.
- Visual inspection of all three rendered PDF pages confirmed no clipping, missing diagram, missing row, or internal alpha/Command/synthetic label.

## Mutation and next boundary

- DB migration/schema/data write: false
- API/business-data mutation: false
- R2/Worker/generated-document/PDF lifecycle/production mutation: false
- Local Chromium print PDF is an excluded QA artifact only.
- No new PowerShell menu is needed because the existing integrated `automation-infrastructure` profile owns the alpha.33 static/build contract.
- Alpha.34 owns actual immutable PDF binary generation, renderer/schema versioning, deterministic R2 object keys, generated-document metadata, idempotency, and partial-mutation recovery under separate approval.
