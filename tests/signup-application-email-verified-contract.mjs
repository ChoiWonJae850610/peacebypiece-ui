import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("db/migrations/patch_0_24_26_signup_applications.sql", "utf8");
const types = fs.readFileSync("lib/signup/signupApplicationTypes.ts", "utf8");
const repository = fs.readFileSync("lib/signup/signupApplicationRepository.ts", "utf8");

assert.ok(migration.includes("email_verified boolean NOT NULL"), "email_verified must be NOT NULL");
assert.ok(migration.includes("CHECK (email_verified = true)"), "email_verified=true check must remain");
assert.doesNotMatch(migration, /email_verified boolean NOT NULL DEFAULT true/);
assert.doesNotMatch(migration, /DEFAULT true[\s\S]{0,80}email_verified|email_verified[\s\S]{0,80}DEFAULT true/i);

assert.ok(types.includes("emailVerified: true"), "TS identity must require explicit verified email");
assert.ok(repository.includes("SignupApplicationCreateInput = SignupApplicationIdentity"), "create input must carry identity");
assert.doesNotMatch(repository, /emailVerified\?:|emailVerified:\s*boolean/);

console.log("signup application email verified contract passed");
