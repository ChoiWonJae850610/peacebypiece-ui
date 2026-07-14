# WAFL v2 Alpha.36 Mobile Material Card Separation and Summary Evidence

Status: `LEVEL_4_PRODUCT_VERIFIED`.

## Delivery identity

- Baseline HEAD: `ba4df947009617c45d0af699ea24693e4dcee9b7`.
- Baseline version: `2.0.0-alpha.35`.
- Result version: `2.0.0-alpha.36`.
- Result HEAD: recorded by the matching final repo-state artifact.

## Alpha.35 remaining gaps

- The final row omitted the unit-price label/value even though order quantity and amount were present.
- Empty core inputs could expose default `미입력`, `입력`, or `0` placeholder copy.
- Missing calculation prerequisites could appear as a real zero result.
- Adjacent material cards relied mostly on content flow and did not read clearly enough as separate row groups.

## Display contract

- The two core rows remain supplier/color-option/unit-price and required/allowance/stock. Unit remains directly below the material name.
- Core fields and unit use an empty placeholder. Missing required values are represented only by the existing muted label and underline.
- Usage area keeps `사용 부위를 알려주세요`; memo keeps `메모를 입력하세요`.
- The last row is `발주 {quantity unit} · 단가 {price} · 금액 {amount}` with state-allowed actions on the right.
- Missing order inputs or unit price render `—` in the corresponding summary slot. No warning sentence or synthetic zero value is added.
- Unit suffix changes do not convert the number. Existing local order quantity and amount formulas remain unchanged.

## Card separation contract

- Each material card adds an 8px bottom interval and faint `#fffdf8` work-surface tone.
- The existing subtle top line and left status accent remain the border grammar. No shadow, elevation, thick border, nested box, or extra information band is added.
- Internal order remains header, core row 1, core row 2, usage area, memo, and final summary/action row.
- The compact card body target remains the alpha.35 representative 214px.

## Product evidence

| Owner requirement | Runtime evidence | Result |
|---|---|---|
| Complete final summary | The first fabric rendered `발주 382 yd · 단가 12,800원 · 금액 4,889,600원` in one row. | PASS |
| Incomplete calculation | Clearing unit price changed the same row to `발주 382 yd · 단가 — · 금액 —`; restoring `12800` restored the original values. | PASS |
| Core placeholder removal | Supplier, color/option, unit price, required, allowance, stock, and unit expose an empty placeholder. Only usage area and memo retain production guidance. | PASS |
| Stable compact height | The representative phone card stayed `214px` before, during, and after the missing-price interaction. Tablet cards measured `212px` because the wider line box rounds differently; no content block was added. | PASS |
| Card separation | Every material card uses an `8px` bottom interval, an 8px radius, the faint work surface, and the existing subtle top/left status lines. Shadow/elevation and thick border are absent. | PASS |
| Responsive layout | Root horizontal overflow was `0` at 390x844, 768x1024, and 1024x768. Summary and actions did not wrap or overlap. | PASS |
| Preview current runtime | The localhost sample showed `리넨 라운드 셔츠 원피스`, revision metadata, and exact total `144`; mobile and desktop overflow were `0`, console warning/error was `0`, and the production host returned `404`. | PASS |
| Mixed-orientation print regression | Preview renderer/route source diff is `0`. The accepted alpha.35 Chromium binary was re-inspected: three nonblank pages, page 1 A4 landscape and pages 2-3 A4 portrait. Alpha.36 does not generate a new document or alter print CSS. | PASS |

Evidence files are ignored and excluded from delivery ZIPs:

- `artifacts/alpha35/mobile-fabric-before.png`
- `artifacts/alpha35/sample-issued-workorder-print.pdf`
- `artifacts/alpha36/mobile-fabric-after.png`
- `artifacts/alpha36/mobile-accessory-after.png`
- `artifacts/alpha36/mobile-missing-price.png`
- `artifacts/alpha36/tablet-portrait-material-cards.png`
- `artifacts/alpha36/tablet-landscape-material-cards.png`
- `artifacts/alpha36/mobile-sample-preview.png`
- `artifacts/alpha36/desktop-sample-preview.png`

## Boundary and next gate

- DB migration/schema/data mutation: false.
- API/business-data mutation: false.
- R2/Worker/PDF/generated-document/production mutation: false.
- Root package/lockfile/dependency change: false.
- No new PowerShell menu or 2.0 roadmap TypeScript is added; the existing `automation-infrastructure` profile remains canonical.
- Alpha.37 owns actual immutable PDF binary generation and R2 storage foundation under a separate work order and explicit mutation/storage approval.
