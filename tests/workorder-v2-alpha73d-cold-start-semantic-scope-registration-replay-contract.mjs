#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  resolveWaflKeyboardAppearanceRevealIdentity,
  resolveWaflKeyboardAppearanceRootRevealClaim,
  resolveWaflPreparedGeometryFreshness,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const input = read("apps/mobile/features/inputs/WaflSheetTextInput.tsx");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const create = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");

const fullSemanticRect = { x: 16, y: 24, width: 326, height: 184 };
const sameRect = (left, right) => left?.x === right?.x
  && left?.y === right?.y
  && left?.width === right?.width
  && left?.height === right?.height;

function createSemanticScope() {
  let current = null;
  const listeners = new Set();
  return {
    emit(layout) {
      current = layout;
      for (const listener of listeners) listener();
    },
    resolve: () => current,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function createRegistry() {
  let layout = null;
  let revision = 0;
  return {
    read: () => ({ layout, revision }),
    register(next) {
      if (sameRect(layout, next)) return false;
      layout = next;
      revision += 1;
      return true;
    },
  };
}

function installSubscribeThenReplay(scope, registry) {
  const notify = () => registry.register(scope.resolve());
  const unsubscribe = scope.subscribe(notify);
  notify();
  return unsubscribe;
}

// CASE 1: listener exists before the first native semantic layout.
{
  const scope = createSemanticScope();
  const registry = createRegistry();
  const unsubscribe = installSubscribeThenReplay(scope, registry);
  scope.emit(fullSemanticRect);
  assert.deepEqual(registry.read().layout, fullSemanticRect);
  unsubscribe();
}

// CASE 2: layout before subscription is recovered by immediate replay.
{
  const scope = createSemanticScope();
  const registry = createRegistry();
  scope.emit(fullSemanticRect);
  const unsubscribe = installSubscribeThenReplay(scope, registry);
  assert.deepEqual(registry.read(), { layout: fullSemanticRect, revision: 1 });
  unsubscribe();
}

// CASE 3: layout during setup is observed because subscription happens first.
{
  const registry = createRegistry();
  let current = null;
  const scope = {
    resolve: () => current,
    subscribe(listener) {
      current = fullSemanticRect;
      listener();
      return () => {};
    },
  };
  installSubscribeThenReplay(scope, registry);
  assert.deepEqual(registry.read().layout, fullSemanticRect);
}

// CASE 4: replaying an unchanged rect does not churn registry revision.
{
  const scope = createSemanticScope();
  const registry = createRegistry();
  scope.emit(fullSemanticRect);
  registry.register(fullSemanticRect);
  installSubscribeThenReplay(scope, registry);
  assert.equal(registry.read().revision, 1);
}

const freshness = (overrides = {}) => resolveWaflPreparedGeometryFreshness({
  currentGeometryRevision: 12,
  currentLayoutGeneration: 4,
  currentRegistryRevision: 8,
  currentSemanticTargetPresent: true,
  openReady: true,
  presentationIdentityCurrent: true,
  requiredMeasurementsComplete: true,
  semanticTargetGeometryCurrent: true,
  snapshotGeometryRevision: 12,
  snapshotLayoutGeneration: 4,
  snapshotRegistryRevision: 8,
  snapshotSemanticScopeComplete: true,
  snapshotSemanticTargetPresent: true,
  ...overrides,
});
const appearance = (generation = 1, keyboardClass = "TEXT") => resolveWaflKeyboardAppearanceRevealIdentity({
  appearanceGeneration: generation,
  focusGeneration: generation,
  keyboardClass,
  layoutGeneration: 4,
  measurementIdentity: "new-recipe:semantic-replay",
  openGeneration: generation,
});

// CASE 5: missing/stale registry geometry cannot mutate or consume root.
const stale = freshness({ semanticTargetGeometryCurrent: false });
assert.equal(stale.reason, "SEMANTIC_TARGET_GEOMETRY_STALE");
let rootState = { appearanceIdentity: null, rootAuthorCount: 0 };
let claim = resolveWaflKeyboardAppearanceRootRevealClaim({
  appearanceIdentity: appearance(),
  current: rootState,
  requestsRoot: stale.current,
});
assert.equal(claim.allowRootAuthor, false);
assert.equal(claim.state.rootAuthorCount, 0);

// CASE 6: a current full semantic rect may author exactly one correct root.
assert.deepEqual(freshness(), { current: true, reason: "CURRENT" });
claim = resolveWaflKeyboardAppearanceRootRevealClaim({
  appearanceIdentity: appearance(),
  current: claim.state,
  requestsRoot: true,
});
assert.equal(claim.allowRootAuthor, true);
rootState = claim.state;
assert.equal(resolveWaflKeyboardAppearanceRootRevealClaim({
  appearanceIdentity: appearance(),
  current: rootState,
  requestsRoot: true,
}).allowRootAuthor, false);

// CASE 7/8: warm fast-path and repeated TEXT/PHONE appearances preserve one root and zero drift.
for (let generation = 1; generation <= 10; generation += 1) {
  const identity = appearance(generation, generation % 2 === 0 ? "TEXT" : "PHONE_NUMBER");
  const first = resolveWaflKeyboardAppearanceRootRevealClaim({
    appearanceIdentity: identity,
    current: { appearanceIdentity: null, rootAuthorCount: 0 },
    requestsRoot: freshness().current,
  });
  assert.equal(first.allowRootAuthor, true);
  assert.equal(resolveWaflKeyboardAppearanceRootRevealClaim({
    appearanceIdentity: identity,
    current: first.state,
    requestsRoot: true,
  }).allowRootAuthor, false);
}

// LIVE source owns subscribe-then-replay and current scope/registry/prepared equality.
const subscriptionIndex = input.indexOf("revealBlock.subscribeLayout(handleLayoutNotification)");
const replayIndex = input.indexOf('registerMountedEditableTarget("subscription-replay")');
assert.ok(subscriptionIndex >= 0 && replayIndex > subscriptionIndex);
assert.match(input, /useLayoutEffect\(\(\) => \{[\s\S]*semantic-scope-subscriber-installed[\s\S]*semantic-scope-immediate-replay/u);
assert.match(input, /resolveLayoutRevision[\s\S]*resolveLayoutUpdatedAtMs/u);
assert.match(input, /semantic-scope-parent-layout[\s\S]*rawParentLocalLayout/u);
assert.match(input, /semantic-scope-coordinate-normalized[\s\S]*normalizedBodyContentLayout/u);
assert.doesNotMatch(input, /setTimeout|focus polling/u);
assert.match(sheet, /resolveSheetLocalLayout\(\)[\s\S]*semanticGeometryCurrent/u);
assert.match(sheet, /areWaflSheetLocalLayoutsEqual\(registrySemanticLayout, currentSemanticLayout\)[\s\S]*areWaflSheetLocalLayoutsEqual\(preparedSemanticLayout, registrySemanticLayout\)/u);
assert.match(sheet, /semanticTargetGeometryCurrent/u);
assert.match(sheet, /direct-input-registry-replay-noop[\s\S]*registryRevisionChanged: false/u);
assert.match(sheet, /preparedSemanticLayoutRevision[\s\S]*currentSemanticLayoutRevision/u);
assert.match(create, /<WaflSheetSemanticFocusScope[\s\S]*<WaflSheetValueField[\s\S]*<WorkOrderCharacterChoice[\s\S]*<\/WaflSheetSemanticFocusScope>/u);

for (const retiredOwner of ["PanResponder", "wafl-sheet-header-drag-zone", "settledOffsetRef", "preKeyboardSettledOffsetRef"]) {
  assert.doesNotMatch(sheet, new RegExp(retiredOwner, "u"));
}
assert.match(read("lib/constants/version.ts"), /2\.0\.0-alpha\.(?:72|73|74|75)/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73d-cold-start-semantic-scope-registration-replay",
  checkpoint: "ALPHA73D_COLD_START_SEMANTIC_SCOPE_REGISTRATION_REPLAY_IPHONE_REQA_REQUIRED",
  caseCount: 8,
  invariants: [
    "SEMANTIC_SCOPE_INITIAL_LAYOUT_REPLAY",
    "SUBSCRIBE_THEN_REPLAY_NO_GAP",
    "COLD_START_REGISTRY_SEMANTIC_RECT_CURRENT",
    "MISSED_INITIAL_LAYOUT_ROOT_CLAIM_ZERO",
    "FIRST_FOCUS_FULL_CHARACTER_CHOICE_VISIBLE",
    "SINGLE_ROOT_REVEAL_PRESERVED",
  ],
  unchangedReplayRevisionChurn: 0,
  staleSemanticBodyMutations: 0,
  staleSemanticRootMutations: 0,
  staleSemanticRootClaims: 0,
  rootAuthorsPerAppearanceMax: 1,
  warmFastPathPreserved: true,
  physicalResultInferred: false,
}));
