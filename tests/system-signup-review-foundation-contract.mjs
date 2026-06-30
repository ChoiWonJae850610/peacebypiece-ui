#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const repository = fs.readFileSync("lib/system/signupReviewRepository.ts", "utf8");
const listApi = fs.readFileSync("app/api/system/signup/applications/route.ts", "utf8");
const detailApi = fs.readFileSync("app/api/system/signup/applications/[applicationId]/route.ts", "utf8");
const listPage = fs.readFileSync("app/(system)/system/signup-applications/page.tsx", "utf8");
const detailPage = fs.readFileSync("app/(system)/system/signup-applications/[applicationId]/page.tsx", "utf8");
const listView = fs.readFileSync("components/system/signup/SystemSignupReviewListView.tsx", "utf8");
const detailView = fs.readFileSync("components/system/signup/SystemSignupReviewDetailView.tsx", "utf8");
const actions = fs.readFileSync("components/system/signup/SystemSignupReviewDetailActions.tsx", "utf8");
const navigation = fs.readFileSync("lib/system/systemConsoleShell.ts", "utf8");
const pendingUi = fs.readFileSync("components/signup/SignupApplicationDashboard.tsx", "utf8");

for (const source of [listApi, detailApi]) {
  assert.match(source, /requireSystemAdminScope/, "system signup review APIs must require actual system-admin scope");
  assert.match(source, /Cache-Control": "no-store"/, "system signup review APIs must be no-store");
  assert.doesNotMatch(source, /role.*searchParams|admin.*searchParams|actor.*searchParams/i, "client query parameters must not be authority");
}

for (const source of [listPage, detailPage]) {
  assert.match(source, /getCurrentWaflAuthSession/, "system signup review pages must check the actual auth session");
  assert.match(source, /isActiveSystemAdminSession/, "system signup review pages must require active system-admin");
  assert.doesNotMatch(source, /getEffective|effective/i, "system signup review page access must not use effective customer role");
}

assert.match(repository, /LIMIT \$2::int \+ 1 OFFSET \$3::int/, "review queue must use bounded pagination");
assert.match(repository, /Math\.min\(Math\.max\(Math\.trunc\(parsed\), 1\), MAX_LIMIT\)/, "review queue limit must be clamped");
assert.match(repository, /WHERE app\.status = ANY\(\$1::text\[\]\)/, "review queue filters must be parameterized");
assert.match(repository, /WHERE app\.id = \$1/, "detail lookup must be parameterized by application id");
assert.match(repository, /UPDATE signup_applications[\s\S]*WHERE id = \$1[\s\S]*AND status = \$3/, "transitions must be compare-and-set");
assert.match(repository, /status = 'reviewing'[\s\S]*AND status = 'submitted'/, "submitted to reviewing transition must be explicit");
assert.match(repository, /status = 'changes_requested'[\s\S]*status IN \('submitted', 'reviewing'\)/, "changes_requested transition must be restricted");
assert.match(repository, /status = 'rejected'[\s\S]*status IN \('submitted', 'reviewing'\)/, "rejected transition must be restricted");
assert.match(repository, /SIGNUP_REVIEW_REASON_REQUIRED/, "correction/rejection reason must be required");
assert.match(repository, /slice\(0, REVIEW_REASON_MAX_LENGTH\)/, "reason must be bounded");
assert.match(repository, /correction_due_at = now\(\) \+ interval '3 days'/, "correction due date must be set");
assert.match(repository, /rejection_reason = \$4/, "rejection reason must be persisted without new schema");
assert.doesNotMatch(repository, /status = 'approved'|created_company_id\s*=|created_subscription_id\s*=|INSERT INTO companies|INSERT INTO company_members|INSERT INTO company_subscriptions/i, "review foundation must not approve or provision");

assert.match(repository, /requiredConsentTypesPresent/, "list/detail must expose consent type presence");
assert.match(repository, /requiredConsentVersionsCurrent/, "list/detail must expose consent current-version status");
assert.match(repository, /requiredConsentsComplete: requiredConsentTypesPresent && requiredConsentVersionsCurrent/, "required consents must not be count-only");
assert.match(detailView, /consent\.consentType/, "detail UI must display consent type");
assert.match(detailView, /consent\.policyVersion/, "detail UI must display consent version");
assert.match(detailView, /formatDate\(consent\.agreedAt\)/, "detail UI must display consent agreedAt");

assert.match(detailView, /certificateViewerPath/, "detail UI must link the certificate inline viewer");
assert.match(repository, /\/api\/system\/signup\/applications\/\$\{encodeURIComponent\(row\.id\)\}\/certificate\/\$\{encodeURIComponent\(listItem\.certificate\.fileId\)\}\/view/, "viewer link must use system-admin proxy route");
assert.doesNotMatch(repository + detailView, /storageKey|storage_key|R2_WORKER_UPLOAD_URL|signature|token|secret|googleSub\s*:|google_sub\s+AS/i, "review API/UI must not expose raw storage key, Worker URL, token, secret, or raw Google sub");
assert.match(repository, /googleSubjectFingerprint/, "identity evidence may expose only a Google subject fingerprint");
assert.match(repository, /createHash\("sha256"\)/, "Google subject fingerprint must use SHA-256");
assert.match(repository, /row\.email_verified === true/, "email evidence must reflect DB value");
assert.doesNotMatch(repository, /emailVerified:\s*true|googleEmailVerified:\s*true/, "email evidence must not hardcode true");

assert.match(actions, /expectedStatus: application\.status/, "client transition must send expected status for CAS");
assert.match(actions, /SIGNUP_REVIEW_TRANSITION_FAILED/, "client transition errors must stay safe");
assert.match(actions, /승인 준비 중/, "approve must be disabled/placeholder only");
assert.doesNotMatch(actions, /runTransition\("approved"\)|action:\s*"approved"|fetch\([^)]*approve/i, "client must not execute approve/provisioning");
assert.match(actions, /disabled[\s\S]*승인 준비 중/, "approve must remain disabled placeholder");
assert.match(detailApi, /isSameOrigin/, "mutation route must enforce same-origin");
assert.match(detailApi, /SIGNUP_REVIEW_SAME_ORIGIN_REQUIRED/, "same-origin failure must be safe");
assert.match(detailApi, /codeForError/, "API must map unknown errors to safe code");
assert.doesNotMatch(detailApi, /message: getErrorMessage|error\.message[,}]/, "API must not expose raw DB errors");

assert.match(pendingUi, /changes_requested/, "applicant pending UI must still handle changes_requested");
assert.match(pendingUi, /rejected/, "applicant pending UI must still handle rejected");
assert.match(navigation, /href: "\/system\/signup-applications"/, "system console navigation must link review queue");
assert.match(listView, /submitted[\s\S]*reviewing[\s\S]*changes_requested/, "default review queue must include submitted/reviewing/changes_requested");
assert.match(listView, /provisioning_failed/, "list filters must include provisioning_failed");

console.log("system signup review foundation contract: OK");
