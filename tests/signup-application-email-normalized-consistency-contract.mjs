import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("db/migrations/patch_0_24_26_signup_applications.sql", "utf8");
const repository = fs.readFileSync("lib/signup/signupApplicationRepository.ts", "utf8");

assert.match(migration, /email = trim\(email\)/);
assert.match(migration, /length\(email\) > 0/);
assert.match(migration, /email_normalized = lower\(trim\(email\)\)/);
assert.match(migration, /length\(email_normalized\) > 0/);

for (const token of [
  "normalizeSignupEmail",
  "assertSignupApplicationCreateInput",
  "input.email !== input.email.trim()",
  "input.emailNormalized !== normalizeSignupEmail(input.email)",
]) {
  assert.ok(repository.includes(token), `email normalization contract missing ${token}`);
}

console.log("signup application email normalized consistency contract passed");
