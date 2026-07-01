#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const billing = fs.readFileSync("lib/billing/canonicalBillingPolicy.ts", "utf8");
const defaultPlans = fs.readFileSync("lib/billing/defaultPlans.ts", "utf8");
const subscriptionPolicy = fs.readFileSync("lib/billing/companySubscriptionPolicy.ts", "utf8");

for (const token of [
  "BILLING_CURRENCY = \"KRW\"",
  "BILLING_VAT_POLICY = \"vat_included\"",
  "STORAGE_ADD_ON_PRICE_KRW = 7000",
  "monthlyPriceKrw: 0",
  "monthlyPriceKrw: 9900",
  "monthlyPriceKrw: 19900",
  "monthlyPriceKrw: 39900",
  "negotiated: true",
  "monthlyCompanyWideExportLimit: 1",
  "monthlyCompanyWideExportLimit: 3",
  "monthlyCompanyWideExportLimit: 10",
]) {
  assert.ok(billing.includes(token), `canonical billing policy missing ${token}`);
}

assert.match(defaultPlans, /priceKrw:\s*9900/);
assert.match(defaultPlans, /priceKrw:\s*19900/);
assert.match(defaultPlans, /priceKrw:\s*39900/);
assert.match(subscriptionPolicy, /trial:[\s\S]*storageLimitBytes:\s*100\s*\*\s*1024\s*\*\s*1024[\s\S]*memberLimit:\s*3/);
assert.match(subscriptionPolicy, /lite:[\s\S]*storageLimitBytes:\s*500\s*\*\s*1024\s*\*\s*1024[\s\S]*memberLimit:\s*3/);
assert.match(subscriptionPolicy, /flow:[\s\S]*Math\.round\(1\.5\s*\*\s*1024\s*\*\s*1024\s*\*\s*1024\)[\s\S]*memberLimit:\s*10/);
assert.match(subscriptionPolicy, /studio:[\s\S]*storageLimitBytes:\s*5\s*\*\s*1024\s*\*\s*1024\s*\*\s*1024[\s\S]*memberLimit:\s*30/);

console.log("billing pricing policy contract passed");
