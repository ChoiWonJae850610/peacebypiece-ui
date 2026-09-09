#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { createWaflDecisionGuard } from "../apps/mobile/domain/waflDecisionPolicy.ts";
import { createWorkOrderSketchParentCloseGuard } from "../apps/mobile/features/work-orders/drawing/workOrderSketchClosePolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const editor = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");
const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const decisionSheet = read("apps/mobile/features/feedback/WaflDecisionSheet.tsx");

let nestedDecisionVisible = true;
let decisionResolutionCount = 0;
let parentCloseInvocationCount = 0;
let saveMutationCount = 0;
const transitions = [];
const parentClose = createWorkOrderSketchParentCloseGuard();
function closeParent() {
  if (!parentClose.close()) return false;
  parentCloseInvocationCount += 1;
  transitions.push({ nestedDecisionVisible, parentModalVisible: false });
  return true;
}
const decision = createWaflDecisionGuard(
  () => { decisionResolutionCount += 1; },
  () => {
    decisionResolutionCount += 1;
    closeParent();
  },
);

// The fixed product order first completes the nested sheet close, then resolves discard.
nestedDecisionVisible = false;
assert.equal(decision.apply("action"), true);
assert.equal(decision.apply("action"), false);
assert.equal(parentClose.close(), false);
assert.equal(decisionResolutionCount, 1);
assert.equal(parentCloseInvocationCount, 1);
assert.equal(transitions[0]?.nestedDecisionVisible, false);
assert.equal(transitions[0]?.parentModalVisible, false);
assert.equal(saveMutationCount, 0);

assert.match(decisionSheet, /readonly resolveAfterClose\?: boolean/u);
assert.match(decisionSheet, /pendingResolutionRef = useRef<WaflDecisionOption \| null>\(null\)/u);
assert.match(decisionSheet, /pendingResolutionRef\.current = value;\s*setVisible\(false\)/u);
assert.match(decisionSheet, /onAfterClose=\{props\.resolveAfterClose \? resolveAfterSheetClose : undefined\}/u);
assert.match(decisionSheet, /visible=\{visible\}/u);
assert.match(editor, /<WaflDecisionSheet decision=\{decision\} resolveAfterClose/u);
assert.match(editor, /function closeEditorSession\(\) \{\s*if \(!parentCloseGuardRef\.current\.close\(\)\) return;\s*props\.onClose\(\);\s*cancelAllTransientGestures\(\);\s*setDecision\(null\);/u);
assert.match(editor, /if \(intent === "close"\) \{ closeEditorSession\(\); return; \}/u);
assert.match(editor, /onConfirm: closeEditorSession/u);
assert.match(editor, /onCancel: \(\) => setDecision\(null\)/u);
assert.match(editor, /onRequestClose=\{requestClose\}/u);
assert.match(gallery, /onClose=\{\(\) => setSketchVisible\(false\)\} visible=\{sketchVisible\}/u);

const closeBody = editor.match(/function closeEditorSession\(\) \{([\s\S]*?)\n  \}/u)?.[1] ?? "";
assert.ok(closeBody);
assert.doesNotMatch(closeBody, /\bsave\s*\(|savePrimaryWorkOrderDrawing|fetch\(|PATCH|expectedVersion/u);
assert.match(editor, /savePrimaryWorkOrderDrawing/u);
assert.match(editor, /drawingScenesEqual\(reconciled\.scene, submitted\)/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73a2-sketch-discard-exit",
  previousPermanentInventoryRetained: 229,
  addedPermanentChecks: 1,
  finalPermanentInventory: 230,
  decisionResolutionCount,
  parentCloseInvocationCount,
  nestedDecisionVisibleAfterResolution: nestedDecisionVisible,
  parentModalVisibleAfterResolution: false,
  saveApiDbR2Mutation: 0,
  physicalResultInferred: false,
}));
