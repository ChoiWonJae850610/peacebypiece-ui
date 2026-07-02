import assert from "node:assert/strict";
import fs from "node:fs";

const provisioning = fs.readFileSync("lib/signup/signupApplicationProvisioningRepository.ts", "utf8");
const readiness = fs.readFileSync("lib/billing/signupPaymentReadinessRepository.ts", "utf8");
const route = fs.readFileSync("app/api/system/signup/applications/[applicationId]/approve/route.ts", "utf8");
const actions = fs.readFileSync("components/system/signup/SystemSignupReviewDetailActions.tsx", "utf8");

assert.ok(provisioning.includes("SIGNUP_APPROVAL_PAYMENT_READINESS_REQUIRED"));
assert.ok(provisioning.includes("hasReadyPaymentMethodReference"));
assert.ok(provisioning.includes("signup_payment_method_references"));
assert.ok(readiness.includes("copySignupReadinessToCompanyPaymentReference"));
assert.ok(readiness.includes("company_payment_method_references"));
assert.ok(provisioning.includes("readiness_state = 'ready'"));
assert.ok(provisioning.includes("provider_code = 'fake_dev_test'"));
assert.ok(provisioning.includes("createTrialBillingState"));
assert.ok(provisioning.includes("insertNotificationOutbox"));
assert.ok(route.includes("SIGNUP_APPROVAL_PAYMENT_READINESS_REQUIRED"));
assert.ok(actions.includes("RUN_SIGNUP_APPROVAL_PROVISIONING_DEV_TEST"));
assert.ok(actions.includes("승인 및 Trial 생성"));

console.log("billing approval gate contract passed");
