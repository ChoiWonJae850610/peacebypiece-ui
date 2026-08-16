import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const exists = (path) => fs.existsSync(path);

const start = read("docs/project/app-v2/00-start-here.md");
const principles = read("docs/project/app-v2/02-mobile-tablet-ux-principles.md");
const themeV1 = read("docs/project/app-v2/11-app-design-theme-v1.md");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const ia = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");
const reference = read("docs/project/app-v2/11c-mobile-design-system-v2-visual-reference.md");
const theme = read("apps/mobile/constants/theme.ts");
const shell = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const image = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const sizeColor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const materials = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const documents = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const actionTile = read("apps/mobile/features/inputs/WaflActionTile.tsx");
const actionGroup = read("apps/mobile/features/inputs/WaflActionTileGroup.tsx");
const sectionCard = read("apps/mobile/features/layout/WaflSectionCard.tsx");
const sectionHeaderAction = read("apps/mobile/features/layout/WaflSectionHeaderAction.tsx");
const optionGrid = read("apps/mobile/features/inputs/WaflOptionGrid.tsx");

for (const owner of ["11a-mobile-design-system-v2.md", "11b-maker-workorder-tab-ia-v2.md"]) {
  assert.match(start, new RegExp(owner.replaceAll(".", "\\.")));
  assert.match(principles, new RegExp(owner.replaceAll(".", "\\.")));
}
assert.match(themeV1, /Historical first App-first theme/);
assert.match(design, /current normative owner/);
assert.match(ia, /six visible Maker WorkOrder mobile tabs/);
assert.match(reference, /not pixel, token, copy, or product-policy authority/);
assert.ok(exists("docs/project/app-v2/assets/mobile-design-system-v2/wafl-mobile-ui-system-proposal.png"));
assert.ok(exists("docs/project/app-v2/assets/mobile-design-system-v2/wafl-mobile-ia-wireframe-proposal.png"));

for (const semanticOwner of ["screenGutterPhone", "screenGutterTablet", "cardPadding", "sectionGap", "actionTileGap", "actionTileMaxWidth", "cardMajor", "actionTileMinHeight", "productTitle", "sectionTitle", "actionLabel"]) {
  assert.match(theme, new RegExp(`\\b${semanticOwner}\\b`), `missing theme role ${semanticOwner}`);
}
assert.match(shell, /WAFL_THEME\.layout\.screenGutterPhone/);
assert.match(shell, /WAFL_THEME\.layout\.screenGutterTablet/);
assert.match(actionTile, /WAFL_THEME\.touch\.actionTileMinHeight/);
assert.match(actionTile, /WAFL_THEME\.radius\.actionTile/);
assert.match(actionGroup, /WAFL_THEME\.layout\.actionTileMaxWidth/);
assert.match(actionGroup, /flexWrap: "wrap"/);
assert.match(sectionCard, /WAFL_THEME\.radius\.cardMajor/);
assert.match(sectionCard, /WAFL_THEME\.layout\.cardPadding/);

for (const [name, source] of [["image", image], ["documents", documents]]) {
  assert.match(source, /WaflActionTileGroup/, `${name} must use shared capped action layout`);
}
assert.match(sizeColor, /WaflOptionGrid/);
assert.match(optionGrid, /variant\?: "selection" \| "summary"/);
assert.match(materials, /WaflSectionHeaderAction/);
assert.match(sectionHeaderAction, /WAFL_THEME\.touch\.minimum/);
assert.match(overview, /WaflSectionCard/);
assert.match(documents, /WaflSectionCard/);
assert.doesNotMatch(materials, /listToolbar:\s*\{[^}]*width:\s*"100%"|AddMaterialButton/);

const quickAction = documents.indexOf('testID="document-quick-delivery-action"');
const quickSheet = documents.indexOf('visible={quickDeliveryOpen}');
const quickComposer = documents.indexOf("<QuickDeliveryFoundation", quickSheet);
assert.ok(quickAction >= 0 && quickSheet > quickAction && quickComposer > quickSheet, "Quick Delivery must open in the shared sheet/deep editor");
assert.doesNotMatch(documents.slice(quickAction, quickSheet), /quickDeliveryOpen\s*\?\s*<QuickDeliveryFoundation/);

for (const preserved of ["ProductionCardMock", "/ui", "preserved"]) assert.match(`${design}\n${reference}`, new RegExp(preserved.replace("/", "\\/"), "i"));

console.log("workorder-v2-alpha64-mobile-design-system-v2-contract: PASS");
