#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  canPresentWaflNestedSheet,
  canTransitionWaflNestedSheet,
  matchesWaflNestedSheetFocusIntent,
  nextWaflNestedSheetPresentationGeneration,
} from "../apps/mobile/domain/waflNestedSheetTransitionPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const hook = read("apps/mobile/features/inputs/useWaflNestedSheetHandoff.ts");
const quick = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
const address = read("apps/mobile/features/work-orders/documents/QuickDeliveryAddressSearchSheet.tsx");

let generation = 0;
for (let cycle = 0; cycle < 3; cycle += 1) {
  assert.equal(canPresentWaflNestedSheet({ currentVisible: false, hasPendingRoute: false, hasQueuedPresentation: false }), true);
  generation = nextWaflNestedSheetPresentationGeneration(generation);
  for (const route of ["picker", "direct", "address", "direct"]) {
    assert.equal(canTransitionWaflNestedSheet({ currentVisible: true, hasPendingRoute: false }), true, `${route} transition cycle ${cycle}`);
    assert.equal(canTransitionWaflNestedSheet({ currentVisible: false, hasPendingRoute: true }), false);
    generation = nextWaflNestedSheetPresentationGeneration(generation);
  }
}
assert.equal(generation, 15);

const focusIntent = { endpoint: "destination", generation: 9, target: "detail-address" };
assert.equal(matchesWaflNestedSheetFocusIntent(focusIntent, focusIntent), true);
assert.equal(matchesWaflNestedSheetFocusIntent(focusIntent, { ...focusIntent, endpoint: "origin" }), false);
assert.equal(matchesWaflNestedSheetFocusIntent(focusIntent, { ...focusIntent, generation: 10 }), false);

assert.match(hook, /requestAnimationFrame\(\(\) => \{[\s\S]*requestAnimationFrame/u);
assert.match(hook, /setPresentationGeneration\(nextWaflNestedSheetPresentationGeneration\)/u);
assert.match(quick, /useWaflNestedSheetHandoff<QuickNestedRoute>/u);
assert.match(quick, /nested\.transition\("address"\)/u);
assert.match(quick, /function cancelAddressSearch\(\) \{[\s\S]*nested\.transition\("direct"\)/u);
assert.match(quick, /function selectAddress\(item: AddressSearchItem\)[\s\S]*nested\.transition\("direct"\)/u);
assert.match(quick, /endpoint: activeEndpoint,[\s\S]*generation: nested\.presentationGeneration \+ 1/u);
assert.match(quick, /matchesWaflNestedSheetFocusIntent/u);
assert.match(quick, /onAfterClose=\{finishNestedClose\}/u);
assert.match(address, /readonly visible: boolean/u);
assert.match(address, /onAfterClose=\{props\.onAfterClose\}/u);
assert.doesNotMatch(address, /sheetVisible|selectedItemRef|confirmCloseRef/u);
assert.doesNotMatch(quick, /pendingNestedTarget|directSheetVisible|addressSearchOpen|focusDetailAfterSearch/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha64-quick-nested-lifecycle-stability",
  repeatedCycles: 3,
  routeTransitionsPerCycle: 4,
  endpointScopedFocusIntent: true,
  selectCancelSharedPresentationSequence: true,
  productionMutation: 0,
}));
