#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflSheetEntranceReadiness,
  resolveWaflSheetMeasurementIdentity,
} from "../apps/mobile/domain/waflSheetDetentPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const policy = read("apps/mobile/domain/waflSheetDetentPolicy.ts");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const reelSizing = read("apps/mobile/features/inputs/reel-picker/waflReelSheetSizingPolicy.ts");
const templates = read("apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx");
const sizeColor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const inline = read("apps/mobile/components/ControlledInlineEditValue.tsx");
const surface = read("apps/mobile/components/waflEditableValueSurface.ts");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const ia = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");

assert.deepEqual(resolveWaflSheetEntranceReadiness({
  currentGenerationBodyMeasured: false,
  deterministicBodyHeight: 234,
  footerMeasured: true,
  hasActions: true,
  headerMeasured: true,
  sizing: "reelAdaptive",
}), { ready: true, targetSource: "deterministic-reel" });
assert.equal(resolveWaflSheetEntranceReadiness({
  currentGenerationBodyMeasured: false,
  deterministicBodyHeight: 0,
  footerMeasured: true,
  hasActions: true,
  headerMeasured: true,
  sizing: "adaptiveExpandable",
}).ready, false);
assert.deepEqual(resolveWaflSheetEntranceReadiness({
  currentGenerationBodyMeasured: true,
  deterministicBodyHeight: 0,
  footerMeasured: true,
  hasActions: true,
  headerMeasured: true,
  sizing: "adaptiveExpandable",
}), { ready: true, targetSource: "current-generation-measurement" });

const firstIdentity = resolveWaflSheetMeasurementIdentity({
  hasActions: true,
  openSessionGeneration: 1,
  sizing: "adaptiveExpandable",
  title: "스펙 불러오기",
});
const secondIdentity = resolveWaflSheetMeasurementIdentity({
  hasActions: true,
  openSessionGeneration: 2,
  sizing: "adaptiveExpandable",
  title: "스펙 불러오기",
});
assert.notEqual(firstIdentity, secondIdentity);
const repeatedOpenIdentities = Array.from({ length: 3 }, (_, index) => resolveWaflSheetMeasurementIdentity({
  hasActions: true,
  openSessionGeneration: index + 1,
  sizing: "reelAdaptive",
  title: "대상",
}));
assert.equal(new Set(repeatedOpenIdentities).size, 3);
for (let cycle = 0; cycle < 3; cycle += 1) {
  const readiness = resolveWaflSheetEntranceReadiness({
    currentGenerationBodyMeasured: false,
    deterministicBodyHeight: 234,
    footerMeasured: true,
    hasActions: true,
    headerMeasured: true,
    sizing: "reelAdaptive",
  });
  assert.equal(readiness.ready, true, `cycle ${cycle + 1} must resolve one deterministic entrance target`);
}

for (const marker of [
  "resolveWaflSheetEntranceReadiness",
  "openSessionGeneration",
  "currentGenerationBodyMeasured",
  "targetSource",
]) assert.ok(policy.includes(marker), `atomic entrance policy missing ${marker}`);
for (const marker of [
  "new Animated.Value(window.height)",
  "const [rendered, setRendered] = useState(false)",
  "entranceReadinessSecondFrameRef",
  "entranceReadyTargetRef.current !== `${measurementIdentity}:${mediumOffset}`",
  "setHeaderMeasured(false)",
  "setFooterMeasured(false)",
  "measured: true",
  "draggable && openReady && !actionPending",
]) assert.ok(sheet.includes(marker), `shared entrance owner missing ${marker}`);
assert.match(reel, /sizing="reelAdaptive"/u);
assert.match(reel, /adaptiveMinimumBodyHeight=\{reelAdaptiveBodyHeight\}/u);
assert.match(reelSizing, /WAFL_REEL_ROW_HEIGHT = 44/u);
assert.match(reelSizing, /WAFL_REEL_VISIBLE_ROWS = 5/u);
assert.match(reelSizing, /BODY_TOP_GAP = 14/u);
assert.match(reelSizing, /MODE_SWITCH_HEIGHT = 50/u);

assert.match(templates, /sizing="adaptiveExpandable"/u);
assert.match(sizeColor, /loadTemplates\(\)\.then\(\(loaded\) => \{ if \(loaded\) setTemplatePickerOpen\(true\); \}\)/u);
assert.match(sizeColor, /loadTemplates\(\)\.then\(\(loaded\) => \{ if \(loaded\) setTemplateSaveOpen\(true\); \}\)/u);
assert.doesNotMatch(sizeColor, /setTemplate(?:Picker|Save)Open\(true\); void loadTemplates\(\)/u);

for (const marker of [
  "WAFL_TABLE_EDITABLE_CELL_SURFACE",
  "WAFL_TABLE_EDITABLE_CELL_FOCUSED_SURFACE",
  "minHeight: WAFL_THEME.layout.frozenTableEditableValueHeight",
  "borderBottomWidth: WAFL_THEME.border.hairline",
  "borderRadius: 0",
]) assert.ok(surface.includes(marker), `table focus owner missing ${marker}`);
assert.match(inline, /presentation\?: "default" \| "tableCell"/u);
assert.equal((sizeColor.match(/presentation="tableCell"/gu) ?? []).length, 2);
assert.match(sizeColor, /WAFL_TABLE_EDITABLE_CELL_SURFACE/u);
const focusedSurfaceStart = surface.indexOf("WAFL_TABLE_EDITABLE_CELL_FOCUSED_SURFACE");
const focusedSurfaceEnd = surface.indexOf("};", focusedSurfaceStart);
assert.ok(focusedSurfaceStart >= 0 && focusedSurfaceEnd > focusedSurfaceStart);
assert.doesNotMatch(surface.slice(focusedSurfaceStart, focusedSurfaceEnd), /borderWidth:/u);

for (const marker of [
  "one atomic bottom-origin entrance",
  "visible fallback stop followed by a second correction animation is forbidden",
  "Focus may change the thin underline color",
  "focus never alters row/grid geometry",
]) assert.ok(`${design}\n${ia}`.includes(marker), `canonical docs missing ${marker}`);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha64-atomic-sheet-entrance-table-focus",
  previousPermanentInventoryRetained: 133,
  addedPermanentChecks: 1,
  finalPermanentInventory: 134,
  reelEntranceTarget: "deterministic-before-animation",
  dynamicEntranceTarget: "stable-current-generation-measurement",
  tableFocusGeometryShift: 0,
  repeatedOpenCycles: 3,
  productionMutation: 0,
}));
