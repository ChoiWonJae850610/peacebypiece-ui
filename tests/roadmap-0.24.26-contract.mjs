import assert from "node:assert/strict";
import fs from "node:fs";

const roadmap = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.26.ts", "utf8");
const index = fs.readFileSync("lib/internal/roadmap/index.ts", "utf8");
const productizationRoadmap = fs.readFileSync("docs/productization-roadmap.md", "utf8");
const backlog = fs.readFileSync("docs/productization-backlog.md", "utf8");

for (const token of [
  'version: "0.24.26"',
  "Public Signup, Verification, Approval, and Trial",
  "Google OAuth",
  "email_verified=true",
  "Unjoined verified-user state",
  "New company application creation",
  "invitation/code",
  "join_requests",
  "invitations",
  "System-admin review",
  "Pending/rejected limited state screens",
  "Block /workspace and workspace APIs before approval",
  "Approval-time provisioning",
  "Idempotent provisioning",
  "Trial: 7 days, 100MB storage, 3 members",
  "Trial starts when the system administrator approves the signup",
  "Business certificate is required",
  "Approval viewer only",
  "IDOR defense",
  "duplicate prevention",
  "email normalization",
  "rate limit",
  "CAPTCHA",
  "Migration",
  "user approval",
  "Actual PG payment charge and subscription operation; this remains 0.24.31",
  "raw card data",
  "fake card placeholders",
  "fake payment references",
]) {
  assert.ok(roadmap.includes(token), `0.24.26 roadmap missing ${token}`);
}

for (const section of [
  "scope",
  "outOfScope",
  "implementationPrinciples",
  "successConditions",
  "failureConditions",
  "permissionImpact",
  "dbImpact",
  "r2Impact",
  "migrationRequired",
  "automaticTests",
  "manualTests",
  "stopConditions",
  "expectedChangeAreas",
  "futureDependencies",
  "userDecisionsRequired",
  "userConfirmationRequired",
]) {
  assert.ok(roadmap.includes(section), `0.24.26 roadmap missing section ${section}`);
}

assert.match(index, /ROADMAP_0_24_26/);
assert.match(index, /roadmap-0\.24\.26/);
assert.match(productizationRoadmap, /0\.24\.26 - Public Signup, Verification, Approval, and Trial/);
assert.match(productizationRoadmap, /0\.24\.28 - PDF and R2 Lifecycle/);
assert.match(productizationRoadmap, /0\.24\.30 - Storage Enforcement, Termination, and Automatic Deletion/);
assert.match(productizationRoadmap, /DB scenario H is 99%/);
assert.match(backlog, /0\.24\.28 Reserved: PDF and R2 Lifecycle/);
assert.match(backlog, /0\.24\.30 Reserved: Storage Enforcement, Termination, and Automatic Deletion/);
assert.match(backlog, /Capacity Fixture Backlog/);

assert.doesNotMatch(roadmap, /queryDb|createSignedUploadUrl|PutObjectCommand|DeleteObjectCommand|migration execution/i);

console.log("roadmap 0.24.26 contract passed");
