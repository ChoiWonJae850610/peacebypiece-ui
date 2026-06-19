import assert from "node:assert/strict";
import fs from "node:fs";

const seed = fs.readFileSync("tools/simulator/commands/db-data.mjs", "utf8");
const consoleSource = fs.readFileSync("app/dev/test-console/DevTestConsoleClient.tsx", "utf8");
const repository = fs.readFileSync("lib/dev/testContext/repository.ts", "utf8");

for (const token of [
  "business_registration_number",
  "postal_code",
  "road_address",
  "address_detail",
  "onboarding_completed_at",
  "phone_source",
]) {
  assert.ok(seed.includes(token), `Simulator Seed 회사 프로필 필수값 누락: ${token}`);
}
assert.ok(seed.includes("CASE WHEN $4::text = 'active' THEN now() ELSE NULL END"));
assert.ok(repository.includes("AS profile_complete"));
assert.ok(repository.includes("c.onboarding_status"));
assert.ok(consoleSource.includes("업무 테스트 가능"));
assert.ok(consoleSource.includes("회사정보 미완료"));
assert.ok(consoleSource.includes("승인 대기"));
assert.ok(consoleSource.includes("보완 필요"));

console.log("PASS Simulator onboarding fixture contract");
