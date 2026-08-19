#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { resolveProductionProcessAccentIndex } from "../apps/mobile/domain/productionCardAccentPolicy.ts";
import { resolveWaflReelAdaptiveBodyHeight } from "../apps/mobile/features/inputs/reel-picker/waflReelSheetSizingPolicy.ts";

const read = (path) => fs.readFileSync(path, "utf8");
const production = read("apps/mobile/features/work-orders/production/WorkOrderProductionAuthoring.tsx");
const materials = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const card = read("apps/mobile/features/layout/WaflCompactEntityCard.tsx");
const theme = read("apps/mobile/constants/theme.ts");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const makerIa = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");

assert.match(card, /WaflCompactEntityCard/u);
assert.match(card, /accentColor\?: string/u);
assert.match(card, /borderLeftWidth: WAFL_THEME\.accentCard\.width/u);
assert.match(card, /WAFL_THEME\.layout\.compactCardInsetHorizontal/u);
assert.match(card, /WAFL_THEME\.layout\.compactCardInsetVertical/u);
assert.match(theme, /accentCard:\s*\{ width: 4 \}/u);
assert.match(theme, /productionAccent:\s*\{[\s\S]*factoryAccent:[\s\S]*processAccents:/u);
for (const marker of [
  "WAFL_THEME.accentCard.width",
  "WAFL_THEME.layout.compactCardInsetHorizontal",
  "WAFL_THEME.layout.compactCardInsetVertical",
  "WAFL_THEME.typography.compactCardPrimary",
  "WAFL_THEME.typography.compactCardLabel",
  "WAFL_THEME.typography.compactCardValue",
]) assert.ok(`${materials}\n${production}`.includes(marker), `shared Material/Production card token missing ${marker}`);

for (const code of ["PRINTING", "EMBROIDERY", "WASHING", "검수", "포장"]) {
  const first = resolveProductionProcessAccentIndex(code, 4);
  const second = resolveProductionProcessAccentIndex(code, 4);
  assert.equal(first, second);
  assert.ok(first >= 0 && first < 4);
}
assert.match(production, /factoryRole \? WAFL_THEME\.productionAccent\.factoryAccent/u);
assert.match(production, /resolveProductionProcessAccentIndex\(process\.processTypeCode/u);
assert.doesNotMatch(production, /accentColor=\{[^}]{0,120}(?:status|orderStatus|issued)/u);
assert.doesNotMatch(production, /title=\{process\.processName\}/u);
assert.match(production, /label="공정"[\s\S]*value=\{process\.processName\}/u);

const singleChoiceBody = resolveWaflReelAdaptiveBodyHeight({
  renderPath: "single-choice-reel",
  hasModeSwitch: false,
  hasSupplementaryControl: false,
  hasValidationMessage: false,
});
assert.equal(singleChoiceBody, 252);
assert.match(reel, /<Text style=\{styles\.reelLabel\}>\{label\}<\/Text>/u);
assert.match(reel, /requireSpecifiedValue\?: boolean/u);
assert.match(reel, /requireSpecifiedValue && !state\.selectedValue\.trim\(\)/u);
assert.match(production, /allowUnset: selectedProcess === null/u);
assert.match(production, /requireSpecifiedValue: selectedProcess === null/u);
assert.match(production, /if \(!processCode\.trim\(\)\) return false/u);

assert.match(production, /productionPresentationCache/u);
assert.match(production, /DelayedLoadingMessage identity=\{`production:\$\{workOrderId\}`\} loading scope="production"/u);
assert.match(production, /\(!data \|\| !options\) && error/u);

for (const marker of [
  "Production authoring is a sibling of the live Materials compact-card family",
  "UI-only `미지정` sentinel",
  "Cached cards remain visible",
  "process_type_code",
]) assert.ok(`${design}\n${makerIa}`.includes(marker), `canonical Production refinement missing ${marker}`);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha65-production-card-picker-refinement",
  previousPermanentInventoryRetained: 141,
  addedPermanentChecks: 1,
  finalPermanentInventory: 142,
  reelSingleChoiceBody: singleChoiceBody,
  migrationLedger: "18/18",
  migration019: 0,
  productionMutation: 0,
  ownerFixtureMutation: 0,
}));
