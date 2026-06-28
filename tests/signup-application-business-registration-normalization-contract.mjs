import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("db/migrations/patch_0_24_26_signup_applications.sql", "utf8");
const repository = fs.readFileSync("lib/signup/signupApplicationRepository.ts", "utf8");
const types = fs.readFileSync("lib/signup/signupApplicationTypes.ts", "utf8");

assert.ok(migration.includes("business_registration_number_normalized text NOT NULL"));
assert.match(migration, /regexp_replace\(business_registration_number, '\[\^0-9\]', '', 'g'\)/);
assert.match(migration, /business_registration_number_normalized ~ '\^\[0-9\]\{10\}\$'/);
assert.match(
  migration,
  /signup_applications_active_business_registration_idx[\s\S]*business_registration_number_normalized/,
);

for (const token of [
  "businessRegistrationNumberNormalized",
  "normalizeBusinessRegistrationNumber",
  "findActiveByBusinessRegistrationNormalized",
]) {
  assert.ok(`${repository}\n${types}`.includes(token), `normalization contract missing ${token}`);
}

assert.match(repository, /replace\(\/\\D\/g, ""\)/);
assert.match(repository, /\^\\d\{10\}\$/);

console.log("signup application business registration normalization contract passed");
