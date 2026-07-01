#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const payment = fs.readFileSync("lib/billing/paymentMethodReferencePolicy.ts", "utf8");
const notification = fs.readFileSync("lib/billing/notificationOutboxPolicy.ts", "utf8");
const billingIndex = fs.readFileSync("lib/billing/index.ts", "utf8");

for (const token of [
  "RAW_PAYMENT_DATA_FORBIDDEN_KEYS",
  "cardNumber",
  "cvc",
  "cardPassword",
  "residentRegistrationNumber",
  "rawAuthorizationHeader",
  "providerSecret",
  "webhookSecret",
  "rawProviderRequest",
  "rawProviderResponse",
  "fake_dev_test",
  "isServerProductionRuntime",
  "blocked_pending_provider",
]) {
  assert.ok(payment.includes(token), `payment policy missing ${token}`);
}

for (const token of ["rawCardNumber", "signedUrl", "rawR2Url", "secret", "token"]) {
  assert.ok(notification.includes(token), `notification sensitive key policy missing ${token}`);
}

assert.ok(billingIndex.includes("paymentMethodReferencePolicy"), "billing index must export payment method policy");
assert.doesNotMatch(payment, /toss|nicepay|inicis|portone|iamport/i, "billing foundation must stay provider-neutral");
assert.doesNotMatch(payment, /sk_test|sk_live|merchantKey|apiSecret/i, "billing policy must not hardcode provider secrets");

console.log("billing security contract passed");
