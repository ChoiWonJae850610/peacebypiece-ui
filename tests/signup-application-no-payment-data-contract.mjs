import assert from "node:assert/strict";
import fs from "node:fs";

const implementationFiles = [
  "db/migrations/patch_0_24_26_signup_applications.sql",
  "lib/signup/signupApplicationTypes.ts",
  "lib/signup/signupApplicationRepository.ts",
  "lib/signup/signupApplicationService.ts",
  "lib/signup/signupApplicationProvisioning.ts",
  "lib/signup/signupApplicationSession.ts",
  "lib/signup/signupApplicationFilePolicy.ts",
];

const implementation = implementationFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");
const roadmap = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.26.ts", "utf8");
const prep = fs.readFileSync("docs/project/33-public-signup-schema-repository-prep-0.24.26.md", "utf8");

for (const forbidden of [
  /card_number/i,
  /cardNumber/,
  /raw_card/i,
  /payment_reference_provider/i,
  /payment_reference_id/i,
  /payment_reference_status/i,
  /billing_key/i,
  /billingKey/,
  /pg_token/i,
  /pgToken/,
  /fake payment reference/i,
]) {
  assert.doesNotMatch(implementation, forbidden, `forbidden payment/card token found: ${forbidden}`);
}

assert.ok(`${roadmap}\n${prep}`.includes("0.24.31"), "roadmap/prep must keep payment implementation deferred");

console.log("signup application no payment data contract passed");
