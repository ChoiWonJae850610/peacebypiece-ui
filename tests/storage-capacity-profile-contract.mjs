#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");

const version = read("lib/constants/version.ts");
const planPolicy = read("lib/billing/planPolicy.ts");
const subscriptionPolicy = read("lib/billing/companySubscriptionPolicy.ts");
const defaultPlans = read("lib/billing/defaultPlans.ts");
const fullReset = read("db/schema/full_reset.sql");
const quotaPolicy = read("lib/billing/storageQuotaPolicy.ts");
const subscriptionRepository = read("lib/billing/companySubscriptionRepository.ts");

assert.match(version, /APP_VERSION = "0\.24\.32"/);

for (const token of [
  "LITE: \"lite\"",
  "FLOW: \"flow\"",
  "STUDIO: \"studio\"",
  "TRIAL: 100 * 1024 * 1024",
  "LITE: 500 * 1024 * 1024",
  "FLOW: Math.round(1.5 * 1024 * 1024 * 1024)",
  "STUDIO: 5 * 1024 * 1024 * 1024",
  "TRIAL: 3",
  "LITE: 3",
  "FLOW: 10",
  "STUDIO: 30",
]) {
  assert.ok(planPolicy.includes(token), `plan policy missing ${token}`);
}

for (const forbidden of [
  "STARTER",
  "TEAM",
  "BUSINESS",
  "starter",
  "team",
  "business",
]) {
  assert.ok(!planPolicy.includes(forbidden), `legacy plan token remains in plan policy: ${forbidden}`);
}

assert.match(subscriptionPolicy, /lite:\s*\{[\s\S]*storageLimitBytes:\s*500\s*\*\s*1024\s*\*\s*1024,[\s\S]*memberLimit:\s*3/);
assert.match(subscriptionPolicy, /flow:\s*\{[\s\S]*storageLimitBytes:\s*Math\.round\(1\.5\s*\*\s*1024\s*\*\s*1024\s*\*\s*1024\),[\s\S]*memberLimit:\s*10/);
assert.match(subscriptionPolicy, /studio:\s*\{[\s\S]*storageLimitBytes:\s*5\s*\*\s*1024\s*\*\s*1024\s*\*\s*1024,[\s\S]*memberLimit:\s*30/);
assert.match(subscriptionPolicy, /custom:\s*\{[\s\S]*storageLimitBytes:\s*5\s*\*\s*1024\s*\*\s*1024\s*\*\s*1024,[\s\S]*memberLimit:\s*30/);

for (const token of [
  "plan-lite",
  "plan-flow",
  "plan-studio",
  "priceKrw: 9900",
  "priceKrw: 19900",
  "priceKrw: 39900",
]) {
  assert.ok(defaultPlans.includes(token), `default plan definition missing ${token}`);
}

for (const forbidden of ["plan-starter", "plan-team", "plan-business"]) {
  assert.ok(!defaultPlans.includes(forbidden), `legacy default plan remains: ${forbidden}`);
  assert.ok(!fullReset.includes(forbidden), `legacy full reset seed remains: ${forbidden}`);
}

for (const token of [
  "'plan-lite'",
  "'lite'",
  "'Lite'",
  "524288000",
  "'plan-flow'",
  "'flow'",
  "'Flow'",
  "1610612736",
  "'plan-studio'",
  "'studio'",
  "'Studio'",
  "5368709120",
]) {
  assert.ok(fullReset.includes(token), `full reset plan seed missing ${token}`);
}

for (const token of [
  "usagePercent",
  "displayUsagePercent",
  "remainingBytes",
  "reservedBytes",
  "StorageCapacityState",
  "Math.min(100, Math.max(0, usagePercent))",
]) {
  assert.ok(quotaPolicy.includes(token), `quota policy missing ${token}`);
}

for (const token of [
  "storageUsagePercent",
  "storageDisplayUsagePercent",
  "storageRemainingBytes",
  "storageState",
]) {
  assert.ok(subscriptionRepository.includes(token), `subscription snapshot missing ${token}`);
}

const profilePercents = [0, 0.5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110];
const displayPercents = profilePercents.map((percent) => Math.min(100, Math.max(0, Math.round(percent))));
assert.deepEqual(displayPercents, [0, 1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 100]);

console.log("storage capacity profile contract passed");
