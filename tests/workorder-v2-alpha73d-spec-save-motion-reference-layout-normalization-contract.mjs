#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const root = process.cwd();
const read = (relative) => fs.readFileSync(`${root}/${relative}`, "utf8");

const templates = read("apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx");
const create = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const sizing = read("apps/mobile/domain/waflSheetDetentPolicy.ts");

const saveSheet = templates.match(/export function CompanyTemplateSaveSheet[\s\S]*?\n\}\n\nconst styles/u)?.[0];
assert.ok(saveSheet, "CompanyTemplateSaveSheet source missing");

// New mode intentionally presents the editable name before the mode selector.
const newBranch = saveSheet.match(/mode === "new" \? <WaflSheetSemanticFocusScope[^>]*>([\s\S]*?)<\/WaflSheetSemanticFocusScope> : <>/u)?.[1];
assert.ok(newBranch, "new-mode conditional composition missing");
assert.ok(newBranch.indexOf("<WaflSheetValueField") < newBranch.indexOf("{modeSelector}"), "new name input must precede mode selector");

// Update mode intentionally keeps the selector before the potentially long list.
const updateBranch = saveSheet.match(/<\/WaflSheetSemanticFocusScope> : <>([\s\S]*?)<\/>\}\n  <\/WaflInputSheet>/u)?.[1];
assert.ok(updateBranch, "update-mode conditional composition missing");
assert.ok(updateBranch.indexOf("{modeSelector}") < updateBranch.indexOf("<TemplateGroup"), "update selector must remain discoverable before template content");

// Both representative surfaces remain on one common direct-input motion owner.
for (const source of [saveSheet, create]) {
  assert.match(source, /<WaflInputSheet/u);
  assert.match(source, /keyboardAutoExpand/u);
  assert.match(source, /keyboardFocusRevealContext=\{WAFL_THEME\.sheet\.textEntryFocusRevealClearance\}/u);
  assert.match(source, /keyboardMode="directInput"/u);
}
assert.match(saveSheet, /sizing="adaptiveExpandable"/u);
assert.match(create, /sizing=\{WAFL_TEXT_ENTRY_FORM_SIZING\}/u);
assert.match(sizing, /WAFL_TEXT_ENTRY_FORM_SIZING: WaflSheetSizing = "adaptiveExpandable"/u);
assert.doesNotMatch(saveSheet, /(Animated|Keyboard\.|keyboardVerticalOffset|translateY|setTimeout|setInterval)/u);

// Current physical evidence supersedes the earlier minimal-field assumption:
// new-save mode explicitly requires its name plus mode-button composition.
assert.match(saveSheet, /<WaflSheetSemanticFocusScope[^>]*testID="spec-save-new-semantic-reveal-scope">[\s\S]*<WaflSheetValueField[\s\S]*\{modeSelector\}[\s\S]*<\/WaflSheetSemanticFocusScope>/u);
assert.match(create, /<WaflSheetSemanticFocusScope[\s\S]*<WaflSheetValueField[\s\S]*<WorkOrderCharacterChoice[\s\S]*<\/WaflSheetSemanticFocusScope>/u);

for (const retiredOwner of ["PanResponder", "wafl-sheet-header-drag-zone", "settledOffsetRef", "preKeyboardSettledOffsetRef"]) {
  assert.doesNotMatch(sheet, new RegExp(retiredOwner, "u"));
}
assert.match(sheet, /keyboardAppearanceRootRevealStateRef/u);
assert.match(sheet, /claimKeyboardRootReveal/u);
assert.match(sheet, /owner: "systemKeyboard"/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73d-spec-save-motion-reference-layout-normalization",
  checkpoint: "ALPHA73D_SPEC_SAVE_MOTION_REFERENCE_LAYOUT_NORMALIZATION_IPHONE_QA_REQUIRED",
  invariants: [
    "SPEC_SAVE_CANONICAL_DIRECT_INPUT_MOTION_OWNER",
    "SPEC_SAVE_NEW_MODE_INPUT_BEFORE_MODE_BUTTONS",
    "SPEC_SAVE_UPDATE_MODE_DISCOVERABLE_SELECTOR",
    "DIRECT_INPUT_MOTION_TIMING_SHARED_TARGET_GEOMETRY_VARIABLE",
  ],
  physicalResultInferred: false,
}));
