import assert from "node:assert/strict";
import fs from "node:fs";

const repo = fs.readFileSync("lib/billing/billingOperationsRepository.ts", "utf8");
const service = fs.readFileSync("lib/billing/billingOperationsService.ts", "utf8");
const types = fs.readFileSync("lib/billing/billingOperationsTypes.ts", "utf8");
const adminRoute = fs.readFileSync("app/api/admin/subscription/operations/route.ts", "utf8");
const systemRoute = fs.readFileSync("app/api/system/billing/operations/route.ts", "utf8");

for (const token of [
  "getReadyPaymentMethodReference",
  "upsertSimulatorPaymentReadiness",
  "createTrialBillingState",
  "insertNotificationOutbox",
  "createFailedPaymentRetryEvidence",
  "ON CONFLICT",
]) {
  assert.ok(repo.includes(token), `repository missing ${token}`);
}

for (const token of [
  "quoteCompanyPlanUpgrade",
  "quoteCompanyPlanDowngrade",
  "cancelCompanySubscriptionAtPeriodEnd",
  "reverseCompanySubscriptionCancellation",
  "convertTrialToPaidWithSimulator",
  "getDeletionPlanDryRun",
  "executeAllowedInProduction: false",
  "broadPrefixDelete: false",
]) {
  assert.ok(service.includes(token), `service missing ${token}`);
}

for (const state of [
  "pending_payment_readiness",
  "trialing",
  "active",
  "cancel_scheduled",
  "past_due",
  "restricted",
  "terminated",
  "recovery_window",
  "deletion_scheduled",
]) {
  assert.ok(types.includes(state), `types missing state ${state}`);
}

for (const route of [adminRoute, systemRoute]) {
  assert.ok(route.includes("isSameOrigin"), "route must keep same-origin guard");
  assert.ok(route.includes("Cache-Control"), "route must be no-store");
  assert.ok(route.includes("isServerProductionRuntime"), "billing simulator route must check server runtime");
  assert.ok(route.includes("createWaflRuntimeBlockedResponse"), "billing simulator route must use WAFL runtime-blocked fallback");
  assert.doesNotMatch(route, /rawProvider|rawR2Url|signedUrl|cardNumber|cvc/i);
}
assert.ok(adminRoute.includes("requireAdminSettingsCompanyScope"));
assert.ok(systemRoute.includes("requireSystemAdminScope"));

console.log("billing operations service contract passed");
