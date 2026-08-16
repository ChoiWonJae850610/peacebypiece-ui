#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const quick = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
const field = read("apps/mobile/features/inputs/WaflSheetValueField.tsx");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const ia = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");

assert.match(quick, /editable=\{false\} label="우편번호"/u);
assert.match(quick, /editable=\{false\} label="기본 주소"/u);
assert.doesNotMatch(quick, /onChange=\{\(zonecode\)/u);
assert.doesNotMatch(quick, /onChange=\{\(basicAddress\)/u);
assert.match(quick, /label="상세주소 \(선택\)"[\s\S]*onChange=\{\(detailAddress\)/u);
assert.match(quick, /label="연락처"[\s\S]*onChange=\{\(contact\)/u);
assert.match(field, /editable \? <WaflSheetTextInput/u);
assert.match(field, /accessibilityLabel=\{`\$\{label\}, 읽기 전용`\}/u);
assert.match(field, /styles\.readOnly/u);
assert.match(design, /Editable and read-only sheet values use one semantic surface family/u);
assert.match(ia, /postal code and basic address are read-only/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha64-quick-readonly-address",
  previousPermanentInventoryRetained: 127,
  addedPermanentChecks: 1,
  finalPermanentInventory: 128,
  readonlyJusoFields: 2,
  directAddressEditHandlers: 0,
  editableDetailContactFields: 2,
}));
