#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { createWorkOrderSketchParentCloseGuard, resolveWorkOrderSketchCloseIntent } from "../apps/mobile/features/work-orders/drawing/workOrderSketchClosePolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const editor = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");
const pdfViewer = read("apps/mobile/features/work-orders/documents/WaflAuthenticatedPdfViewer.tsx");
const primaryAction = read("apps/mobile/features/inputs/WaflPrimaryActionButton.tsx");

assert.equal(resolveWorkOrderSketchCloseIntent({ dirty: false, saving: false }), "close");
assert.equal(resolveWorkOrderSketchCloseIntent({ dirty: true, saving: false }), "confirm");
assert.equal(resolveWorkOrderSketchCloseIntent({ dirty: false, saving: true }), "blocked");
assert.equal(resolveWorkOrderSketchCloseIntent({ dirty: true, saving: true }), "blocked");
let closeCount = 0;
const closeGuard = createWorkOrderSketchParentCloseGuard();
if (closeGuard.close()) closeCount += 1;
assert.equal(closeGuard.close(), false);
assert.equal(closeCount, 1);
closeGuard.reset();
if (closeGuard.close()) closeCount += 1;
assert.equal(closeCount, 2);

assert.doesNotMatch(editor, /<X\b|styles\.iconButton|\{\s*X\s*\} from "lucide-react-native"/);
assert.match(editor, /<View style=\{styles\.header\}>\s*<Text accessibilityRole="header" style=\{styles\.title\}>스케치<\/Text>\s*<\/View>/);
assert.match(editor, /testID="work-order-sketch-footer"/);
assert.match(editor, /label="닫기" onPress=\{requestClose\} testID="work-order-sketch-close"/);
assert.match(editor, /label="저장" onPress=\{\(\) => \{ void save\(\); \}\}/);
assert.match(editor, /onRequestClose=\{requestClose\}/);
assert.match(editor, /resolveWorkOrderSketchCloseIntent\(\{ dirty, saving: savingRef\.current \}\)/);
assert.match(editor, /if \(intent === "close"\) \{ closeEditorSession\(\); return; \}/);
assert.match(editor, /onCancel: \(\) => setDecision\(null\)/);
assert.match(editor, /onConfirm: closeEditorSession/);
assert.match(editor, /actionOptionLabel: "저장하지 않고 나가기"/);
assert.match(editor, /pointerEvents="auto"/);
assert.match(editor, /SafeAreaView/);

assert.match(pdfViewer, /WaflPrimaryActionButton[^\n]+label="닫기"/);
assert.match(editor, /WaflPrimaryActionButton[^\n]+label="닫기"/);
assert.match(primaryAction, /minHeight: 48/);
assert.match(editor, /footerActions: \{ flexDirection: "row"/);
assert.match(editor, /footerAction: \{ flex: 1 \}/);

const requestCloseBody = editor.match(/function requestClose\(\) \{([\s\S]*?)\n  \}\n\n  return <Modal/)?.[1] ?? "";
assert.ok(requestCloseBody);
assert.doesNotMatch(requestCloseBody, /\bsave\s*\(/);
assert.doesNotMatch(requestCloseBody, /savePrimaryWorkOrderDrawing|fetch\(|PATCH|expectedVersion/);
assert.match(editor, /drawingScenesEqual\(reconciled\.scene, submitted\)/);
assert.match(editor, /savePrimaryWorkOrderDrawing/);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73a1-sketch-close-action-correction",
  previousPermanentInventoryRetained: 228,
  addedPermanentChecks: 1,
  finalPermanentInventory: 229,
  topCloseX: "absent",
  bottomClose: "pdf-viewer-pattern",
  semanticCloseOwner: "requestClose",
  explicitSaveOnly: true,
  closeMutation: 0,
  physicalResultInferred: false,
}));
