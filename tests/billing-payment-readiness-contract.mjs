#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const payment = fs.readFileSync("lib/billing/paymentMethodReferencePolicy.ts", "utf8");
const billing = fs.readFileSync("lib/billing/canonicalBillingPolicy.ts", "utf8");
const roadmap = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.31.ts", "utf8");

assert.match(payment, /readiness:\s*"ready"\s*\|\s*"not_ready"\s*\|\s*"blocked_pending_provider"/);
assert.match(payment, /providerCode\s*&&\s*input\.billingKeyReference\s*\?\s*"ready"\s*:\s*"not_ready"/);
assert.match(payment, /fake_dev_test[\s\S]*blocked_pending_provider/);
assert.match(billing, /todayChargeKrw:\s*0/);
assert.match(billing, /scheduledBillingAt/);
assert.match(billing, /scheduledAmountKrw/);
assert.match(billing, /cancellationPolicy/);
assert.match(roadmap, /fake dev\/test reference production block/i);

console.log("billing payment readiness contract passed");
