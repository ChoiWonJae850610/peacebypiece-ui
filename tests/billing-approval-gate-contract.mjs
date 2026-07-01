import assert from "node:assert/strict";
import fs from "node:fs";

const provisioning = fs.readFileSync("lib/signup/signupApplicationProvisioningRepository.ts", "utf8");
const route = fs.readFileSync("app/api/system/signup/applications/[applicationId]/approve/route.ts", "utf8");

assert.ok(provisioning.includes("SIGNUP_APPROVAL_PAYMENT_READINESS_REQUIRED"));
assert.ok(provisioning.includes("hasReadyPaymentMethodReference"));
assert.ok(provisioning.includes("company_payment_method_references"));
assert.ok(provisioning.includes("readiness_state = 'ready'"));
assert.ok(provisioning.includes("provider_code = 'fake_dev_test'"));
assert.ok(provisioning.includes("createTrialBillingState"));
assert.ok(provisioning.includes("insertNotificationOutbox"));
assert.ok(route.includes("SIGNUP_APPROVAL_PAYMENT_READINESS_REQUIRED"));

console.log("billing approval gate contract passed");
