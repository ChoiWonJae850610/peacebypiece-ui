import assert from "node:assert/strict";
import fs from "node:fs";

const trialPolicy = fs.readFileSync("lib/billing/companyTrialPolicy.ts", "utf8");
const planPolicy = fs.readFileSync("lib/billing/planPolicy.ts", "utf8");
const subscriptionPolicy = fs.readFileSync("lib/billing/companySubscriptionPolicy.ts", "utf8");
const joinRequests = fs.readFileSync("lib/invitations/joinRequestRepository.ts", "utf8");
const schema = fs.readFileSync("db/schema/full_reset.sql", "utf8");
const migration = fs.readFileSync("db/migrations/patch_0_20_05_company_subscriptions.sql", "utf8");

assert.match(trialPolicy, /COMPANY_TRIAL_DAYS\s*=\s*7/);
assert.match(trialPolicy, /TRIAL_STORAGE_LIMIT_BYTES\s*=\s*100\s*\*\s*1024\s*\*\s*1024/);
assert.match(trialPolicy, /TRIAL_MEMBER_LIMIT\s*=\s*3/);
assert.doesNotMatch(trialPolicy, /1024\s*\*\s*1024\s*\*\s*1024|TRIAL_MEMBER_LIMIT\s*=\s*5/, "trial policy must not keep legacy 1GB/5 member values");
assert.match(planPolicy, /TRIAL:\s*100\s*\*\s*1024\s*\*\s*1024/);
assert.match(planPolicy, /TRIAL:\s*3/);
assert.match(planPolicy, /LITE:\s*500\s*\*\s*1024\s*\*\s*1024/);
assert.match(planPolicy, /FLOW:\s*Math\.round\(1\.5\s*\*\s*1024\s*\*\s*1024\s*\*\s*1024\)/);
assert.match(planPolicy, /STUDIO:\s*5\s*\*\s*1024\s*\*\s*1024\s*\*\s*1024/);
assert.match(planPolicy, /LITE:\s*3/);
assert.match(planPolicy, /FLOW:\s*10/);
assert.match(planPolicy, /STUDIO:\s*30/);

assert.match(subscriptionPolicy, /trial:\s*\{[\s\S]*storageLimitBytes:\s*100\s*\*\s*1024\s*\*\s*1024[\s\S]*memberLimit:\s*3/);
assert.match(subscriptionPolicy, /lite:\s*\{[\s\S]*storageLimitBytes:\s*500\s*\*\s*1024\s*\*\s*1024[\s\S]*memberLimit:\s*3/);
assert.match(subscriptionPolicy, /flow:\s*\{[\s\S]*storageLimitBytes:\s*Math\.round\(1\.5\s*\*\s*1024\s*\*\s*1024\s*\*\s*1024\)[\s\S]*memberLimit:\s*10/);
assert.match(subscriptionPolicy, /studio:\s*\{[\s\S]*storageLimitBytes:\s*5\s*\*\s*1024\s*\*\s*1024\s*\*\s*1024[\s\S]*memberLimit:\s*30/);
assert.match(schema, /storage_limit_bytes bigint NOT NULL DEFAULT 104857600/);
assert.match(schema, /member_limit integer NOT NULL DEFAULT 3/);
assert.match(migration, /storage_limit_bytes bigint NOT NULL DEFAULT 104857600/);
assert.match(migration, /member_limit integer NOT NULL DEFAULT 3/);

assert.match(joinRequests, /getTrialEndsAt/);
assert.match(joinRequests, /TRIAL_STORAGE_LIMIT_BYTES/);
assert.match(joinRequests, /TRIAL_MEMBER_LIMIT/);
assert.doesNotMatch(joinRequests, /1024\s*\*\s*1024\s*\*\s*1024|member_limit[^;\n]*5|TRIAL_MEMBER_LIMIT\s*=\s*5/);

console.log("trial policy contract: OK");
