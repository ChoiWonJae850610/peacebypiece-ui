import assert from "node:assert/strict";
import fs from "node:fs";

import {
  DOCUMENT_QUANTITY_INLINE_LIMIT,
  documentQuantityDisclosureRows,
} from "../apps/mobile/features/work-orders/documents/quantityDisclosurePolicy.ts";

const read = (path) => fs.readFileSync(path, "utf8");
const matrix = {
  workOrderId: "wo", revisionId: "revision", matrixTotal: "28", expectedTotal: "28", workOrderTotal: "28", revisionTotal: "28", projectionsMatch: true, totalsMatch: true, memoFallback: null, entityVersion: 1,
  sizes: [
    { id: "s3", code: "XL", displayLabel: "XL", displayOrder: 3 },
    { id: "s1", code: "S", displayLabel: "S", displayOrder: 1 },
    { id: "s4", code: "2XL", displayLabel: "2XL", displayOrder: 4 },
    { id: "s2", code: "L", displayLabel: "L", displayOrder: 2 },
  ],
  colors: [
    { id: "c2", displayName: "회색", hexValue: null, displayOrder: 2 },
    { id: "c1", displayName: "남색", hexValue: null, displayOrder: 1 },
  ],
  quantityCells: [
    { colorId: "c2", sizeRowId: "s4", quantity: "8" }, { colorId: "c1", sizeRowId: "s3", quantity: "3" },
    { colorId: "c1", sizeRowId: "s1", quantity: "1" }, { colorId: "c2", sizeRowId: "s2", quantity: "6" },
    { colorId: "c1", sizeRowId: "s4", quantity: "4" }, { colorId: "c2", sizeRowId: "s1", quantity: "5" },
    { colorId: "c1", sizeRowId: "s2", quantity: "2" }, { colorId: "c2", sizeRowId: "s3", quantity: "7" },
  ],
};
const rows = documentQuantityDisclosureRows(matrix);
assert.equal(DOCUMENT_QUANTITY_INLINE_LIMIT, 6);
assert.equal(rows.length, 8);
assert.deepEqual(rows.map((row) => row.label), ["남색 · S", "남색 · L", "남색 · XL", "남색 · 2XL", "회색 · S", "회색 · L", "회색 · XL", "회색 · 2XL"]);
assert.equal(rows.slice(0, DOCUMENT_QUANTITY_INLINE_LIMIT).length, 6);

const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const partner = read("apps/mobile/features/materials/MaterialPartnerPickerSheet.tsx");
const quick = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
const addressSheet = read("apps/mobile/features/work-orders/documents/QuickDeliveryAddressSearchSheet.tsx");
const workbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
assert.match(reel, /allowUnset[\s\S]*WAFL_UNSET_PLACEHOLDER/);
assert.match(partner, /allowUnset/);
assert.match(partner, /onSwitchToDirectInput/);
assert.doesNotMatch(partner, /WAFL_DIRECT_PARTNER_INPUT_VALUE|allowDirectInput|onDirectInput/);
assert.match(quick, /cancelDirectEditor[\s\S]*nested\.dismiss\(\)[\s\S]*setActiveEndpoint\(null\)[\s\S]*setPickerBaseline\(null\)/);
assert.match(quick, /returnToPicker[\s\S]*nested\.transition\("picker"\)/);
assert.match(quick, /applyDirectEditor[\s\S]*setLocation/);
assert.match(quick, /QuickDeliveryAddressSearchSheet/);
assert.match(quick, /inputRef=\{detailAddressInputRef\}/);
assert.match(quick, /onAfterOpen=\{handleDirectAfterOpen\}/);
assert.match(addressSheet, /title="주소 검색"/);
assert.match(addressSheet, /도로명, 건물명 또는 지번 검색/);
assert.match(addressSheet, /generationRef/);
assert.match(addressSheet, /검색 결과가 없습니다\./);
assert.match(addressSheet, /더보기/);
assert.match(workbench, /quantityRows\.slice\(0, DOCUMENT_QUANTITY_INLINE_LIMIT\)/);
assert.match(workbench, /title="사이즈·색상별 수량"/);
for (const source of [quick, addressSheet]) assert.doesNotMatch(source, /Linking|WebView|expo-web-browser|wafl:\/\/quick-delivery|Kakao|postcode\.v2/);

console.log("workorder-v2-alpha64-picker-quantity-address-contract: PASS");
