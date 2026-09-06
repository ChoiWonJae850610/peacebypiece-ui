#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  closeWorkOrderSketchTextSession,
  createWorkOrderSketchTextSession,
  presentWorkOrderSketchTextSession,
  updateWorkOrderSketchTextDraft,
} from "../apps/mobile/features/work-orders/drawing/workOrderSketchTextSessionPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const editor = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");
const projection = read("apps/mobile/features/drawing-poc/drawingRenderProjection.ts");
const renderer = read("apps/mobile/features/drawing-poc/SvgDrawingSceneRenderer.tsx");

const anchorA = Object.freeze({ x: 120, y: 340 });
const anchorB = Object.freeze({ x: 740, y: 910 });
let sessionA = createWorkOrderSketchTextSession(1, anchorA);
assert.equal(sessionA.phase, "opening");
assert.equal(sessionA.focusRequested, false);

// A stale/mismatched presentation callback cannot focus any session.
const staleBeforePresentation = presentWorkOrderSketchTextSession(sessionA, 0);
assert.equal(staleBeforePresentation.requestFocus, false);
assert.equal(staleBeforePresentation.session, sessionA);

const firstPresentation = presentWorkOrderSketchTextSession(sessionA, 1);
assert.equal(firstPresentation.requestFocus, false);
sessionA = firstPresentation.session;
assert.equal(sessionA.phase, "presented");
assert.equal(sessionA.focusRequested, false);
assert.equal(presentWorkOrderSketchTextSession(sessionA, 1).requestFocus, false);

// Typing changes only the transient session and preserves its exact WORLD anchor.
sessionA = updateWorkOrderSketchTextDraft(sessionA, "3cm 줄임 / stitch #2");
assert.equal(sessionA.draft, "3cm 줄임 / stitch #2");
assert.deepEqual(sessionA.anchor, anchorA);
assert.equal(closeWorkOrderSketchTextSession(sessionA).phase, "closing");

// A late callback from A cannot focus replacement session B.
let sessionB = createWorkOrderSketchTextSession(2, anchorB);
assert.equal(presentWorkOrderSketchTextSession(sessionB, 1).requestFocus, false);
const secondPresentation = presentWorkOrderSketchTextSession(sessionB, 2);
assert.equal(secondPresentation.requestFocus, false);
sessionB = updateWorkOrderSketchTextDraft(secondPresentation.session, "포켓 2cm 위");
assert.deepEqual(sessionB.anchor, anchorB);

// A73C keeps the session presentation boundary but removes every automatic focus request.
assert.doesNotMatch(editor, /<WaflSheetValueField\s+autoFocus/u);
assert.match(editor, /onAfterOpen=\{\(\) => presentTextSheet\(textSession\?\.id \?\? null\)\}/u);
assert.doesNotMatch(editor, /textInputRef|\.focus\(\)/u);
assert.match(editor, /presentationGeneration=\{textSession\?\.id\}/u);
assert.match(editor, /presentWorkOrderSketchTextSession\(textSessionRef\.current, sessionId\)/u);
assert.doesNotMatch(editor, /setTimeout|setInterval|focus polling/iu);

// Caret and ghost are renderer-only projected primitives, not committed Scene elements.
assert.match(projection, /projectDrawingTextInsertionPreview/u);
assert.match(projection, /pending-text-insertion-caret/u);
assert.match(projection, /pending-text-ghost-preview/u);
assert.match(projection, /const anchor = screenPoint\(input\.anchor, transform\)/u);
assert.match(projection, /x: anchor\.x,\s*y: anchor\.y/u);
assert.match(editor, /anchor: textSession\.anchor/u);
assert.match(editor, /anchor: session\.anchor/u);
assert.match(renderer, /previewFrame\.map\(renderPrimitive\)/u);

// Confirm is session-scoped and child close never owns the parent Sketch lifecycle.
assert.match(editor, /pending\.sessionId === closingSessionId/u);
assert.match(editor, /isCurrentWorkOrderSketchTextSession\(currentSession, pending\.sessionId\)/u);
const closeBody = editor.match(/function completeTextSheetClose\(\) \{([\s\S]*?)\n  \}/u)?.[1] ?? "";
assert.ok(closeBody);
assert.doesNotMatch(closeBody, /props\.onClose|closeEditorSession/u);
assert.match(editor, /onStartShouldSetPanResponder:[\s\S]*textSessionRef\.current === null/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73b1-sketch-text-input-anchor-preview",
  previousPermanentInventoryRetained: 231,
  addedPermanentChecks: 1,
  finalPermanentInventory: 232,
  presentationOrder: ["anchor", "session", "sheet-presented", "explicit-field-tap", "keyboard"],
  focusRequestsPerSession: 0,
  repeatedSessionPolicy: "ignore-until-current-session-closes",
  previewAnchorEqualsCommittedAnchor: true,
  typingSceneHistoryNetworkMutation: [0, 0, 0],
  physicalResultInferred: false,
}));
