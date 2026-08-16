import assert from "node:assert/strict";
import fs from "node:fs";

import { evaluateMaterialOrderReadiness } from "../lib/domain/work-orders/command/materialOrderReadiness.ts";
import { presentQuickDeliveryLocation } from "../apps/mobile/features/work-orders/documents/quickDeliveryLocationPresentation.ts";

const read = (path) => fs.readFileSync(path, "utf8");
const actionTile = read("apps/mobile/features/inputs/WaflActionTile.tsx");
const actionTileGroup = read("apps/mobile/features/inputs/WaflActionTileGroup.tsx");
const modeSwitch = read("apps/mobile/features/inputs/WaflInputModeSwitch.tsx");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const partnerPicker = read("apps/mobile/features/materials/MaterialPartnerPickerSheet.tsx");
const materialEditor = read("apps/mobile/features/materials/WorkOrderMaterialEditor.tsx");
const materialList = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const sectionHeaderAction = read("apps/mobile/features/layout/WaflSectionHeaderAction.tsx");
const imageGallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const sizeColor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const quick = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
const workbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");

assert.deepEqual(presentQuickDeliveryLocation({
  mode: "direct", place: "성수 샘플실", zonecode: "04790", basicAddress: "서울 성동구 성수일로 1", detailAddress: "3층", contact: "010-0000-0000",
}, "미지정"), {
  primary: "04790 · 서울 성동구 성수일로 1 · 3층",
  secondary: "010-0000-0000",
});
assert.deepEqual(presentQuickDeliveryLocation({
  mode: "direct", place: "", zonecode: "04790", basicAddress: "서울 성동구 성수일로 1", detailAddress: "", contact: "",
}, "미지정"), { primary: "04790 · 서울 성동구 성수일로 1", secondary: null });
assert.deepEqual(presentQuickDeliveryLocation({
  mode: "partner", place: "", zonecode: "", basicAddress: "", detailAddress: "", contact: "", partnerName: "협력 공장", partnerContact: "담당자 02-0000-0000",
}, "미지정"), { primary: "협력 공장", secondary: "담당자 02-0000-0000" });
assert.deepEqual(presentQuickDeliveryLocation({
  mode: "unset", place: "", zonecode: "", basicAddress: "", detailAddress: "", contact: "",
}, "미지정"), { primary: "미지정", secondary: null });

assert.match(modeSwitch, /mode === "picker" \? "직접 입력으로 변경" : "WAFL PICK으로 변경"/);
assert.match(reel, /allowUnset[\s\S]*WAFL_UNSET_PLACEHOLDER/);
assert.match(partnerPicker, /footer=\{props\.onSwitchToDirectInput[\s\S]*WaflInputModeSwitch mode="picker"/);
assert.doesNotMatch(partnerPicker, /직접 입력["'}][\s\S]*optionItems|WAFL_DIRECT_PARTNER_INPUT_VALUE|allowDirectInput|onDirectInput/);
for (const source of [materialEditor, materialList]) {
  assert.match(source, /<MaterialPartnerPickerSheet[\s\S]*allowUnset/);
}
assert.match(quick, /<MaterialPartnerPickerSheet allowUnset[\s\S]*onSwitchToDirectInput=\{openDirectEditor\}/);
assert.match(quick, /<WaflInputModeSwitch mode="direct" onPress=\{returnToPicker\}/);
assert.doesNotMatch(quick, /originLabel|destinationLabel|allowDirectInput|onDirectInput/);

for (const source of [imageGallery, workbench]) assert.match(source, /WaflActionTile/);
for (const token of ["backgroundColor: WAFL_THEME.color.paper", "borderColor: WAFL_THEME.color.border", "minHeight: WAFL_THEME.touch.actionTileMinHeight", "size={WAFL_THEME.icon.small}"]) {
  assert.match(actionTile, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}
assert.match(actionTileGroup, /actionTileMaxWidth/);
for (const source of [imageGallery, workbench]) assert.match(source, /WaflActionTileGroup/);
assert.match(sizeColor, /WaflOptionGrid/);
assert.match(materialList, /WaflSectionHeaderAction/);
assert.match(sectionHeaderAction, /WAFL_THEME\.touch\.minimum/);
for (const testId of ["work-order-image-library", "work-order-size-selection-action", "work-order-color-selection-action", "material-add-", "document-attachment-action", "document-quick-delivery-action"]) {
  assert.ok([imageGallery, sizeColor, read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx"), materialList, workbench].some((source) => source.includes(testId)), `shared action consumer: ${testId}`);
}

const overviewIndex = workbench.indexOf('testID="document-production-overview"');
const dividerIndex = workbench.indexOf("styles.integratedDivider");
const attachmentsIndex = workbench.indexOf('testID="document-attachment-selection"');
const overviewCloseIndex = workbench.indexOf('<View style={styles.actionCluster}', attachmentsIndex);
assert.ok(overviewIndex >= 0 && overviewIndex < dividerIndex && dividerIndex < attachmentsIndex && attachmentsIndex < overviewCloseIndex);
assert.match(workbench, /testID="document-workbench-action-tiles"[\s\S]*label="첨부"[\s\S]*label="퀵 전달"/);
assert.doesNotMatch(workbench, /document-(?:attachment|quick)-tab|label="첨부 선택"/);

const readiness = evaluateMaterialOrderReadiness({
  requiredQuantity: "3.5", allowanceQuantity: "0", inventoryUsageQuantity: "0", orderQuantity: "3.5", unitCode: "m", unitPrice: "1000", supplierPartnerId: null,
});
assert.equal(readiness.ready, false);
assert.ok(readiness.blockers.some((blocker) => blocker.field === "partnerId"));

console.log("workorder-v2-alpha64-shared-action-picker-document-ui-contract: PASS");
