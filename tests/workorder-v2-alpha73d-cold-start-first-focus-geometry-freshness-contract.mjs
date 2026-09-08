#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  resolveWaflKeyboardAppearanceRevealIdentity,
  resolveWaflKeyboardAppearanceRootRevealClaim,
  resolveWaflKeyboardTransitionTrust,
  resolveWaflPreparedGeometryFreshness,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";
import { resolveWaflSheetKeyboardRestoreOffset } from "../apps/mobile/domain/waflSheetKeyboardRestorePolicy.ts";
import { resolveWaflPreparedGeometryRevision } from "../apps/mobile/domain/waflPreparedGeometryRevisionPolicy.ts";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const input = read("apps/mobile/features/inputs/WaflSheetTextInput.tsx");
const create = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");

const freshness = (overrides = {}) => resolveWaflPreparedGeometryFreshness({
  currentGeometryRevision: 11,
  currentLayoutGeneration: 3,
  currentRegistryRevision: 7,
  currentSemanticTargetPresent: true,
  openReady: true,
  presentationIdentityCurrent: true,
  requiredMeasurementsComplete: true,
  semanticTargetGeometryCurrent: true,
  snapshotGeometryRevision: 11,
  snapshotLayoutGeneration: 3,
  snapshotRegistryRevision: 7,
  snapshotSemanticScopeComplete: true,
  snapshotSemanticTargetPresent: true,
  ...overrides,
});
const appearance = ({ generation = 1, keyboardClass = "TEXT" } = {}) => resolveWaflKeyboardAppearanceRevealIdentity({
  appearanceGeneration: generation,
  focusGeneration: generation,
  keyboardClass,
  layoutGeneration: 3,
  measurementIdentity: "new-recipe:static",
  openGeneration: generation,
});
const empty = () => ({ appearanceIdentity: null, rootAuthorCount: 0 });
const claim = (state, identity, requestsRoot) => resolveWaflKeyboardAppearanceRootRevealClaim({
  appearanceIdentity: identity,
  current: state,
  requestsRoot,
});

// CASE 1: a cold-start snapshot at N cannot mutate or consume the root slot after N+1 geometry.
const stale = freshness({ currentGeometryRevision: 12, snapshotGeometryRevision: 11 });
assert.deepEqual(stale, { current: false, reason: "GEOMETRY_REVISION_STALE" });
let state = empty();
let result = claim(state, appearance(), stale.current);
assert.equal(result.allowRootAuthor, false);
assert.equal(result.state.rootAuthorCount, 0);
assert.equal(resolveWaflKeyboardTransitionTrust({
  event: "willChangeFrame",
  frameHeight: 320,
  frameWidth: 390,
  frameY: 524,
  keyboardClassCurrent: true,
  keyboardInset: 320,
  layoutGenerationCurrent: true,
  platform: "ios",
  preparedGeometryCurrent: stale.current,
  windowHeight: 844,
}).trustworthy, false);

// CASE 2/3: current complete semantic geometry may own one target; didShow cannot author a second.
assert.deepEqual(freshness(), { current: true, reason: "CURRENT" });
result = claim(result.state, appearance(), true);
assert.equal(result.allowRootAuthor, true);
state = result.state;
assert.equal(claim(state, appearance(), true).allowRootAuthor, false);

// CASE 4: when early geometry is not ready, the unused slot remains available to final measurement.
const incomplete = freshness({ requiredMeasurementsComplete: false });
assert.equal(incomplete.reason, "REQUIRED_MEASUREMENTS_INCOMPLETE");
result = claim(empty(), appearance(), incomplete.current);
assert.equal(result.state.rootAuthorCount, 0);
result = claim(result.state, appearance(), true);
assert.equal(result.allowRootAuthor, true);

// CASE 5: warm/current geometry preserves the earliest trustworthy native fast path.
assert.equal(resolveWaflKeyboardTransitionTrust({
  event: "willChangeFrame",
  frameHeight: 320,
  frameWidth: 390,
  frameY: 524,
  keyboardClassCurrent: true,
  keyboardInset: 320,
  layoutGenerationCurrent: true,
  platform: "ios",
  preparedGeometryCurrent: freshness().current,
  windowHeight: 844,
}).trustworthy, true);

// CASE 6: ten independent appearances remain one root author and one immutable static rest each.
let staticRest = 244;
for (let cycle = 1; cycle <= 10; cycle += 1) {
  const identity = appearance({ generation: cycle });
  result = claim(empty(), identity, true);
  assert.equal(result.allowRootAuthor, true);
  assert.equal(claim(result.state, identity, true).allowRootAuthor, false);
  staticRest = resolveWaflSheetKeyboardRestoreOffset(staticRest);
  assert.equal(staticRest, 244);
}

// CASE 7: keyboard-class transitions reject stale geometry and give each current incoming frame one slot.
for (let transition = 1; transition <= 10; transition += 1) {
  const identity = appearance({
    generation: transition,
    keyboardClass: transition % 2 === 0 ? "TEXT" : "PHONE_NUMBER",
  });
  const outgoing = freshness({ currentRegistryRevision: transition + 1, snapshotRegistryRevision: transition });
  result = claim(empty(), identity, outgoing.current);
  assert.equal(result.state.rootAuthorCount, 0);
  result = claim(result.state, identity, true);
  assert.equal(result.allowRootAuthor, true);
  assert.equal(claim(result.state, identity, true).allowRootAuthor, false);
}

// Every target-relevant owner participates in freshness, including the presented/open state.
assert.equal(freshness({ currentLayoutGeneration: 4 }).reason, "LAYOUT_GENERATION_STALE");
assert.equal(freshness({ currentRegistryRevision: 8 }).reason, "REGISTRY_REVISION_STALE");
assert.equal(freshness({ openReady: false }).reason, "OPEN_NOT_READY");
assert.equal(freshness({ currentSemanticTargetPresent: false }).reason, "SEMANTIC_TARGET_MISSING");
assert.equal(freshness({ semanticTargetGeometryCurrent: false }).reason, "SEMANTIC_TARGET_GEOMETRY_STALE");
assert.equal(freshness({ snapshotSemanticScopeComplete: false }).reason, "SEMANTIC_SCOPE_INCOMPLETE");

// LIVE ownership: capture revisions/heights, reject before the fast-path block, and publish structured evidence.
assert.match(sheet, /type WaflPreparedDirectInputGeometrySnapshot = \{[\s\S]*capturedAtMs[\s\S]*geometryRevision[\s\S]*registryRevision[\s\S]*requiredMeasurementsComplete/u);
assert.match(sheet, /const resolvePreparedGeometryForTarget = useCallback/u);
assert.match(sheet, /preparedFresh[\s\S]*if \([\s\S]*keyboardMode === "directInput"[\s\S]*&& preparedFresh/u);
assert.match(sheet, /currentGeometryRevision: targetGeometryRevisionRef\.current/u);
assert.match(sheet, /currentRegistryRevision: directInputRegistryRevisionRef\.current/u);
assert.match(sheet, /openReady: openReadyRef\.current/u);
assert.equal(resolveWaflPreparedGeometryRevision(11, "semanticRegistry"), 12);
assert.equal(resolveWaflPreparedGeometryRevision(11, "intrinsicBodyMeasurement"), 12);
assert.equal(resolveWaflPreparedGeometryRevision(11, "runtimeScrollMetrics"), 11);
assert.match(sheet, /resolveWaflPreparedGeometryRevision\([\s\S]*"semanticRegistry"/u);
assert.match(sheet, /directInputRegistryRevisionRef\.current \+= 1/u);
assert.match(sheet, /bodyHeightCapture[\s\S]*footerHeightCapture[\s\S]*headerHeightCapture/u);
assert.match(sheet, /preparedSemanticScopeRect[\s\S]*currentSemanticScopeRect/u);
assert.match(sheet, /preparedGeometryRevision[\s\S]*currentGeometryRevision/u);
assert.match(sheet, /preparedRegistryRevision[\s\S]*currentRegistryRevision/u);
assert.match(sheet, /preparedCapturedAtMs/u);
assert.match(sheet, /rootClaim[\s\S]*rootTarget/u);

// Semantic scope layout uses subscribe-then-replay in a layout-synchronous lifecycle.
assert.match(input, /useLayoutEffect\(\(\) => \{[\s\S]*revealBlock\.subscribeLayout\(handleLayoutNotification\)[\s\S]*registerMountedEditableTarget\("subscription-replay"\)/u);
assert.doesNotMatch(input, /focusBlockLayoutVersion/u);
assert.match(create, /<WaflSheetSemanticFocusScope[\s\S]*<WaflSheetValueField[\s\S]*<WorkOrderCharacterChoice[\s\S]*<\/WaflSheetSemanticFocusScope>/u);
assert.doesNotMatch(create, /keyboardVerticalOffset|setTimeout/u);

for (const retiredOwner of ["PanResponder", "wafl-sheet-header-drag-zone", "settledOffsetRef", "preKeyboardSettledOffsetRef"]) {
  assert.doesNotMatch(sheet, new RegExp(retiredOwner, "u"));
}
assert.match(read("lib/constants/version.ts"), /2\.0\.0-alpha\.(?:72|73|74|75)/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73d-cold-start-first-focus-geometry-freshness",
  checkpoint: "ALPHA73D_COLD_START_FIRST_FOCUS_GEOMETRY_FRESHNESS_IPHONE_REQA_REQUIRED",
  caseCount: 7,
  invariants: [
    "PREPARED_GEOMETRY_REVISION_CURRENT",
    "STALE_PREPARED_GEOMETRY_CLAIM_ZERO",
    "COLD_START_SEMANTIC_SCOPE_COMPLETE",
    "COLD_START_SINGLE_ROOT_REVEAL",
    "WARM_FAST_PATH_PRESERVED",
    "GEOMETRY_REVISION_STALE_CALLBACK_ZERO",
  ],
  stalePreparedBodyMutations: 0,
  stalePreparedRootMutations: 0,
  stalePreparedRootClaims: 0,
  rootAuthorsPerAppearanceMax: 1,
  focusShowHideCycles: 10,
  keyboardClassTransitionCycles: 10,
  cumulativeRootDrift: 0,
  physicalResultInferred: false,
}));
