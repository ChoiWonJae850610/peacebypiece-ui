import assert from "node:assert/strict";
import fs from "node:fs";

const roadmap = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.26.ts", "utf8");
const version = fs.readFileSync("lib/constants/version.ts", "utf8");
const index = fs.readFileSync("lib/internal/roadmap/index.ts", "utf8");
const productizationRoadmap = fs.readFileSync("docs/productization-roadmap.md", "utf8");
const backlog = fs.readFileSync("docs/productization-backlog.md", "utf8");
const prep = fs.readFileSync("docs/project/33-public-signup-schema-repository-prep-0.24.26.md", "utf8");

for (const token of [
  'version: "0.24.26"',
  'status: "in_progress"',
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
  "Actual PG payment charge, payment-method registration, payment-reference storage, and subscription operation; this remains 0.24.31",
  "raw card data",
  "fake card placeholders",
  "fake payment references",
  "System catalog, size, or POM row provisioning; this remains 0.24.27",
  "preparationHistory",
  "ef0602de1c99fea54cd63cc69c110a3e7ad3a79d",
  "0fadb95e9561fb89d0198b393599d419d121e5bd",
  "PostgreSQL signup repository and applicant API/session foundation",
  "schema mutation true only for approved dev/test signup and consent schema migrations",
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
assert.ok(version.includes('APP_VERSION = "0.24.26"'), "APP_VERSION must be 0.24.26");
assert.match(index, /roadmap-0\.24\.26/);
assert.match(productizationRoadmap, /0\.24\.26 - Public Signup, Verification, Approval, and Trial/);
assert.match(productizationRoadmap, /33-public-signup-schema-repository-prep-0\.24\.26\.md/);
assert.match(productizationRoadmap, /0\.24\.28 - PDF and R2 Lifecycle/);
assert.match(productizationRoadmap, /0\.24\.30 - Storage Enforcement, Termination, and Automatic Deletion/);
assert.match(productizationRoadmap, /DB scenario H is 99%/);
assert.match(backlog, /0\.24\.28 Reserved: PDF and R2 Lifecycle/);
assert.match(backlog, /0\.24\.30 Reserved: Storage Enforcement, Termination, and Automatic Deletion/);
assert.match(backlog, /Capacity Fixture Backlog/);

assert.doesNotMatch(roadmap, /queryDb|createSignedUploadUrl|PutObjectCommand|DeleteObjectCommand/i);
assert.match(roadmap, /executed the approved signup and consent schema migrations once against the approved dev\/test DB fingerprint 01e5dcc7fea3/);
assert.match(roadmap, /Production migration and any additional DB mutation remain forbidden/);
assert.doesNotMatch(`${roadmap}\n${prep}`, /payment_reference_provider|payment_reference_id|payment_reference_status|payment-method reference readiness|payment reference readiness/i);
assert.doesNotMatch(`${roadmap}\n${prep}`, /Approval creates .*default catalog|Approval-time provisioning .*default catalog/i);

for (const token of [
  "users.company_id",
  "NOT NULL",
  "Recommendation: choose B",
  "Do not create or execute the migration",
  "signup_applications",
  "Minimum core migration",
  "Separate review before inclusion",
  "approval timestamp",
  "No DB/R2 mutation",
]) {
  assert.ok(prep.includes(token), `0.24.26 prep doc missing ${token}`);
}

console.log("roadmap 0.24.26 contract passed");
