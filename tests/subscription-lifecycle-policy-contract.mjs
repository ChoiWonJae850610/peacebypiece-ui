#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const lifecycle = fs.readFileSync("lib/billing/subscriptionLifecyclePolicy.ts", "utf8");

for (const token of [
  "PAYMENT_RETRY_DAY_OFFSETS = [0, 3, 7, 14, 21, 30]",
  "cancel_scheduled",
  "payment_past_due",
  "restricted",
  "terminated",
  "recovery_window",
  "deletion_scheduled",
  "deleting",
  "deleted",
  "deletion_failed",
  "legal_hold",
  "quoteUpgradeProration",
  "Math.ceil",
  "quoteDowngradeRefund",
  "Math.floor",
  "checkDowngradeEligibility",
  "noForcedDeletion: true",
  "noForcedMemberDisable: true",
  "getRecoveryWindow",
  "deletionRetryCadence: \"hourly\"",
]) {
  assert.ok(lifecycle.includes(token), `subscription lifecycle policy missing ${token}`);
}

assert.doesNotMatch(lifecycle, /DELETE FROM|DROP TABLE|TRUNCATE/i);

console.log("subscription lifecycle policy contract passed");
