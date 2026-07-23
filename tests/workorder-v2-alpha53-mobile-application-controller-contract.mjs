#!/usr/bin/env node
import assert from "node:assert/strict";

import { createExplicitMutationController } from "../apps/mobile/application/mutationController.ts";
import { INITIAL_NAVIGATION_STATE, mobileNavigationReducer } from "../apps/mobile/application/navigationState.ts";
import { failedQueryState, initialQueryState, loadingQueryState, resolvedQueryState } from "../apps/mobile/application/queryState.ts";
import { classifyMobileApiErrorCode } from "../apps/mobile/domain/mobileContract.ts";
import { INITIAL_SESSION_STATE, sessionReducer } from "../apps/mobile/application/sessionState.ts";

let navigation = mobileNavigationReducer(INITIAL_NAVIGATION_STATE, { type: "select", workOrderId: "work-order-a" });
assert.deepEqual(navigation, { screen: "detail", selectedWorkOrderId: "work-order-a", backgrounded: false });
navigation = mobileNavigationReducer(navigation, { type: "background" });
navigation = mobileNavigationReducer(navigation, { type: "foreground" });
assert.equal(navigation.screen, "detail");
navigation = mobileNavigationReducer(navigation, { type: "session-lost" });
assert.deepEqual(navigation, INITIAL_NAVIGATION_STATE);

let query = initialQueryState();
query = loadingQueryState(query);
assert.equal(query.status, "loading");
query = resolvedQueryState([], true);
assert.equal(query.status, "empty");
query = failedQueryState(query, new Error("network"));
assert.equal(query.status, "error");
assert.deepEqual(query.data, []);

assert.deepEqual(classifyMobileApiErrorCode("CONFLICT"), { kind: "known", code: "CONFLICT", rawCode: null });
assert.deepEqual(classifyMobileApiErrorCode("FUTURE_SERVER_CODE"), { kind: "unknown", code: "INTERNAL_ERROR", rawCode: "FUTURE_SERVER_CODE" });

let session = sessionReducer(INITIAL_SESSION_STATE, { type: "connect" });
session = sessionReducer(session, { type: "authenticated" });
session = sessionReducer(session, { type: "background" });
session = sessionReducer(session, { type: "foreground" });
assert.deepEqual(session, { phase: "authenticated", backgrounded: false });
assert.equal(sessionReducer(session, { type: "expire" }).phase, "expired");

const controller = createExplicitMutationController();
let requestCount = 0;
assert.deepEqual(await controller.execute(false, async () => ++requestCount), { kind: "skipped" });
let release;
const first = controller.execute(true, () => new Promise((resolve) => {
  requestCount += 1;
  release = () => resolve("saved");
}));
assert.deepEqual(await controller.execute(true, async () => ++requestCount), { kind: "duplicate-blocked" });
release();
assert.deepEqual(await first, { kind: "success", value: "saved" });
assert.equal(requestCount, 1);

console.log("workorder v2 alpha.53 mobile application controller contract: PASS");
